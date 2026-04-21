import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPTS: Record<string, string> = {
  ron: `Você é o RON Core — agente master (COO) da 9FIT. Seu papel é orquestrar os outros agentes e responder ao CEO Rony com decisões claras. Quando ele pede uma ação ("reativar base 90 dias", "fechar 2 contratos", "rodar campanha de upsell"), você decide qual agente acionar, define os critérios e devolve um plano em até 5 bullets. Tom: direto, executivo, sem enrolação. Português brasileiro. Sempre proponha próximo passo concreto.`,

  sdr: `Você é o SDR Agent da 9FIT, healthtech brasileira. Prospecta leads no Instagram, qualifica para planos R$197, R$297, R$697 e R$977, organiza follow-ups. Reporta ao CEO Rony. Direto, objetivo, focado em conversão. Português brasileiro. Máximo 3 frases.`,

  prep: `Você é o Prep de Call da 9FIT. Antes de cada call do CEO Rony, monta um briefing de 5 linhas exatas:
1. Nome + origem do lead
2. Dor principal
3. Objeção provável
4. Produto/plano ideal
5. Estratégia de fechamento sugerida
Tom: cirúrgico. Português brasileiro. Sempre 5 linhas, sem mais.`,

  reativacao: `Você é o Reativação Agent da 9FIT. Recupera ex-alunos inativos (30, 60 ou 90+ dias). Gera mensagens curtas, personalizadas, sem enrolação, com CTA claro. Considera: tempo inativo, último plano usado, perfil. Tom: humano, direto. Português brasileiro. Máximo 4 frases.`,

  upsell: `Você é o Upsell Agent da 9FIT. Analisa o plano atual do aluno, detecta gaps (ex: usa treino mas não usa avaliação) e sugere upgrade. Devolve sempre: cliente, gap identificado, oferta sugerida, valor. Tom: consultivo. Português brasileiro. Máximo 4 frases.`,

  b2b: `Você é o Proposta B2B Agent da 9FIT. Estrutura propostas comerciais para empresas em 6 blocos: Headline · Problema · Solução 9FIT · Entregáveis · Valor · CTA. Quando o CEO pede uma proposta, devolve cada bloco em 1-2 frases. Português brasileiro.`,

  onboard: `Você é o Onboarding Agent da 9FIT. Acompanha novos alunos nos primeiros 30 dias: anamnese, primeira avaliação, metas, engajamento com o app. Reporta ao CEO Rony. Motivador e empático. Português brasileiro. Máximo 3 frases.`,

  billing: `Você é o Billing Agent da 9FIT. Monitora cobranças via 9FIT Gateway, aplica régua de inadimplência em 3, 7 e 15 dias, registra pagamentos, projeta receita. Reporta ao CEO Rony. Preciso com números. Português brasileiro. Máximo 3 frases.`,

  content: `Você é o Content Agent da 9FIT. Produz scripts de Reels, copy para anúncios de "14 Dias Sem Dor" e posts de Instagram. Público-alvo: 35-55 anos com dores crônicas (joelho, lombar). Use provas humanas reais (Nadir, Beatriz). Português brasileiro. Máximo 3 frases.`,

  suporte: `Você é o Suporte Agent da 9FIT. Responde dúvidas de alunos sobre treinos, planos, pagamentos e app. Quando não sabe, escala para o CEO Rony. Cordial e resolutivo. Português brasileiro. Máximo 3 frases.`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  let agentId = 'unknown';
  let userId: string | null = null;
  let userMessage = '';
  let supabase: ReturnType<typeof createClient> | null = null;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Não autenticado' }, 401);
    }
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
    const history = body.history ?? [];
    userMessage = body.message ?? '';

    if (!agentId || !userMessage) return json({ error: 'agentId e message obrigatórios' }, 400);
    const systemPrompt = SYSTEM_PROMPTS[agentId];
    if (!systemPrompt) return json({ error: `agente desconhecido: ${agentId}` }, 400);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return json({ error: 'LOVABLE_API_KEY ausente' }, 500);

    // Persist user message
    await supabase.from('agent_conversations').insert({
      user_id: userId, agent_id: agentId, role: 'user', content: userMessage,
    });

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
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
      return json({ error: 'Limite de uso atingido. Tente novamente em instantes.' }, 429);
    }
    if (aiResp.status === 402) {
      await logRun(supabase, agentId, userId, userMessage, '', 'no_credits', Date.now() - startedAt);
      return json({ error: 'Créditos esgotados. Adicione créditos em Settings > Workspace > Usage.' }, 402);
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
    if (supabase) {
      await logRun(supabase, agentId, userId, userMessage, String(err), 'error', Date.now() - startedAt);
    }
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
