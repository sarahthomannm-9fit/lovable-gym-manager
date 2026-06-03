import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPTS: Record<string, string> = {
  ron: `Você é o RON Core — agente master (COO) da 9FIT. Orquestra outros agentes e responde ao CEO Rony com decisões claras. Devolve plano em até 5 bullets, próximo passo concreto. Direto, executivo. PT-BR.`,
  sdr: `Você é o SDR Agent da 9FIT. Prospecta no Instagram/LinkedIn, qualifica para planos R$197–R$977, follow-ups. Direto, foco em conversão. Máx 3 frases. PT-BR.`,
  prep: `Você é o Prep de Call da 9FIT. Antes de cada call, devolve EXATAMENTE 5 linhas: 1) Nome+origem 2) Dor 3) Objeção provável 4) Plano ideal 5) Estratégia de fechamento. Cirúrgico. PT-BR.`,
  reativacao: `Você é o Reativação Agent. Recupera ex-alunos 30/60/90+ dias. Mensagens curtas com CTA claro. Humano, direto. Máx 4 frases. PT-BR.`,
  upsell: `Você é o Upsell Agent. Detecta gaps no plano atual e sugere upgrade. Devolve: cliente, gap, oferta, valor. Consultivo. Máx 4 frases. PT-BR.`,
  b2b: `Você é o Proposta B2B Agent. Estrutura proposta em 6 blocos: Headline · Problema · Solução · Entregáveis · Valor · CTA. 1-2 frases por bloco. PT-BR.`,
  onboard: `Você é o Onboarding Agent. Acompanha alunos nos 30 primeiros dias. Motivador, empático. Máx 3 frases. PT-BR.`,
  billing: `Você é o Billing Agent. Régua de inadimplência 3/7/15 dias, projeta receita. Preciso com números. Máx 3 frases. PT-BR.`,
  content: `Você é o Content Agent. Scripts de Reels, copy de anúncios "14 Dias Sem Dor". Público 35-55 com dores crônicas. Provas humanas reais. Máx 3 frases. PT-BR.`,
  suporte: `Você é o Suporte Agent. Responde dúvidas de alunos. Quando não sabe, escala para Rony. Cordial, resolutivo. Máx 3 frases. PT-BR.`,
};

// ações executáveis por agente — server-side, com mutação controlada
type ActionInput = { agentId: string; action: string; payload?: Record<string, unknown> };

async function executeAction(supabase: any, userId: string, { agentId, action, payload }: ActionInput) {
  if (agentId === 'sdr' && action === 'mark_lead_contacted') {
    const leadId = String(payload?.leadId || '');
    if (!leadId) return { ok: false, error: 'leadId obrigatório' };
    const { error } = await supabase.from('leads').update({ status: 'contatado' }).eq('id', leadId);
    if (error) return { ok: false, error: error.message };
    await supabase.from('system_events').insert({
      entity_type: 'lead', entity_id: leadId, event_type: 'lead.contacted',
      metadata: { by: 'sdr_agent', user_id: userId },
    });
    return { ok: true, message: 'Lead marcado como contatado.' };
  }

  if (agentId === 'billing' && action === 'create_charge_reminder') {
    const alunoId = String(payload?.alunoId || '');
    const valor = Number(payload?.valor || 0);
    if (!alunoId) return { ok: false, error: 'alunoId obrigatório' };
    const { error } = await supabase.from('notificacoes').insert({
      tipo: 'cobranca',
      titulo: 'Lembrete de pagamento',
      mensagem: `Cobrança pendente${valor ? ` — R$ ${valor.toFixed(2)}` : ''}. Régua Billing.`,
      destinatario_tipo: 'aluno',
      destinatario_id: alunoId,
      prioridade: 'normal',
      canal: ['sistema', 'whatsapp'],
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: 'Lembrete de cobrança criado.' };
  }

  if (agentId === 'content' && action === 'save_draft') {
    const body = String(payload?.body || '');
    const topic = String(payload?.topic || 'sem tema');
    const type = String(payload?.type || 'reel');
    if (!body) return { ok: false, error: 'body obrigatório' };
    const { data, error } = await supabase.from('content_drafts').insert({
      type, topic, body, status: 'pending_review',
    }).select().single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: 'Rascunho salvo em pending_review.', draftId: data?.id };
  }

  return { ok: false, error: `ação não suportada: ${agentId}/${action}` };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  let agentId = 'unknown';
  let userId: string | null = null;
  let userMessage = '';
  let supabase: ReturnType<typeof createClient> | null = null;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Não autenticado' }, 401);

    supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: 'Token inválido' }, 401);
    userId = userData.user.id;

    const body = await req.json();
    agentId = body.agentId;

    // === MODO AÇÃO ===
    if (body.mode === 'action') {
      if (!agentId || !body.action) return json({ error: 'agentId e action obrigatórios' }, 400);
      const result = await executeAction(supabase, userId!, {
        agentId, action: body.action, payload: body.payload,
      });
      await logRun(supabase, agentId, userId, JSON.stringify({ action: body.action, payload: body.payload }), JSON.stringify(result), result.ok ? 'success' : 'error', Date.now() - startedAt);
      return json(result, result.ok ? 200 : 400);
    }

    // === MODO CHAT ===
    const history = body.history ?? [];
    const skills: { id: string; prompt: string }[] = Array.isArray(body.skills) ? body.skills : [];
    userMessage = body.message ?? '';

    if (!agentId || !userMessage) return json({ error: 'agentId e message obrigatórios' }, 400);
    const systemPrompt = SYSTEM_PROMPTS[agentId];
    if (!systemPrompt) return json({ error: `agente desconhecido: ${agentId}` }, 400);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return json({ error: 'LOVABLE_API_KEY ausente' }, 500);

    const skillsBlock = skills.length
      ? `\n\n## SKILLS ATIVAS\n${skills.map((s) => `### ${s.id}\n${s.prompt}`).join('\n\n')}`
      : '';

    await supabase.from('agent_conversations').insert({
      user_id: userId, agent_id: agentId, role: 'user', content: userMessage,
    });

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt + skillsBlock },
          ...history.slice(-10).map((m: any) => ({
            role: m.role === 'agent' ? 'assistant' : 'user',
            content: m.content || m.text,
          })),
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (aiResp.status === 429) {
      await logRun(supabase, agentId, userId, userMessage, '', 'rate_limited', Date.now() - startedAt);
      return json({ error: 'Limite de uso atingido.' }, 429);
    }
    if (aiResp.status === 402) {
      await logRun(supabase, agentId, userId, userMessage, '', 'no_credits', Date.now() - startedAt);
      return json({ error: 'Créditos esgotados.' }, 402);
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error('AI gateway error:', aiResp.status, t);
      await logRun(supabase, agentId, userId, userMessage, t, 'error', Date.now() - startedAt);
      return json({ error: 'Erro no gateway IA' }, 500);
    }
    const data = await aiResp.json();
    const reply: string = data.choices?.[0]?.message?.content ?? 'Sem resposta.';

    await supabase.from('agent_conversations').insert({
      user_id: userId, agent_id: agentId, role: 'agent', content: reply,
    });

    await logRun(supabase, agentId, userId, userMessage, reply, 'success', Date.now() - startedAt);
    return json({ reply });
  } catch (err) {
    console.error('agent-hub-chat error:', err);
    if (supabase) await logRun(supabase, agentId, userId, userMessage, String(err), 'error', Date.now() - startedAt);
    return json({ error: String(err instanceof Error ? err.message : err) }, 500);
  }
});

async function logRun(
  supabase: any,
  agentId: string,
  userId: string | null,
  input: string,
  output: string,
  status: string,
  latencyMs: number,
) {
  try {
    await supabase.from('agent_logs').insert({
      agent_id: agentId,
      triggered_by: 'ceo',
      input: { message: input },
      output: { reply: output },
      status,
      latency_ms: latencyMs,
      user_id: userId,
    });
  } catch (e) {
    console.error('logRun failed:', e);
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
