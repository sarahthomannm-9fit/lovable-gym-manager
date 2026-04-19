import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPTS: Record<string, string> = {
  sdr: `Você é o SDR Agent da 9FIT, empresa healthtech brasileira. Prospecta leads no Instagram, qualifica para planos de R$197, R$297, R$697 e R$977, organiza follow-ups. Reporta ao CEO Rony. Direto, objetivo, focado em conversão. Sempre em português brasileiro. Máximo 3 frases.`,
  onboard: `Você é o Onboarding Agent da 9FIT. Acompanha novos alunos nos primeiros 30 dias: anamnese, primeira avaliação, metas, engajamento com o app. Reporta ao CEO Rony. Motivador e empático. Sempre em português brasileiro. Máximo 3 frases.`,
  billing: `Você é o Billing Agent da 9FIT. Monitora cobranças via 9FIT Gateway, aplica régua de inadimplência em 3, 7 e 15 dias, registra pagamentos, projeta receita. Reporta ao CEO Rony. Preciso com números. Sempre em português brasileiro. Máximo 3 frases.`,
  content: `Você é o Content Agent da 9FIT. Produz scripts de Reels, copy para anúncios de "14 Dias Sem Dor" e posts de Instagram. Público-alvo: 35-55 anos com dores crônicas (joelho, lombar). Use provas humanas reais (Nadir, Beatriz). Sempre em português brasileiro. Máximo 3 frases.`,
  suporte: `Você é o Suporte Agent da 9FIT. Responde dúvidas de alunos sobre treinos, planos, pagamentos e app. Quando não sabe, escala para o CEO Rony. Cordial e resolutivo. Sempre em português brasileiro. Máximo 3 frases.`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Não autenticado' }, 401);
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: 'Token inválido' }, 401);
    const userId = claims.claims.sub as string;

    const { agentId, history = [], message } = await req.json();
    if (!agentId || !message) return json({ error: 'agentId e message obrigatórios' }, 400);
    const systemPrompt = SYSTEM_PROMPTS[agentId];
    if (!systemPrompt) return json({ error: 'agente desconhecido' }, 400);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return json({ error: 'LOVABLE_API_KEY ausente' }, 500);

    // Persist user message
    await supabase.from('agent_conversations').insert({
      user_id: userId, agent_id: agentId, role: 'user', content: message,
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
          { role: 'user', content: message },
        ],
      }),
    });

    if (aiResp.status === 429) return json({ error: 'Limite de uso atingido. Tente novamente em instantes.' }, 429);
    if (aiResp.status === 402) return json({ error: 'Créditos esgotados. Adicione créditos em Settings > Workspace > Usage.' }, 402);
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error('AI gateway error:', aiResp.status, t);
      return json({ error: 'Erro no gateway IA' }, 500);
    }
    const data = await aiResp.json();
    const reply: string = data.choices?.[0]?.message?.content ?? 'Sem resposta.';

    await supabase.from('agent_conversations').insert({
      user_id: userId, agent_id: agentId, role: 'agent', content: reply,
    });

    return json({ reply });
  } catch (err) {
    console.error('agent-hub-chat error:', err);
    return json({ error: String(err instanceof Error ? err.message : err) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
