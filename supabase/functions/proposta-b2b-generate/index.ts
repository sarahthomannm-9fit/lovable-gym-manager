import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: 'Token inválido' }, 401);

    const { empresa, contato, email, telefone, servicos, valor } = await req.json();
    if (!empresa) return json({ error: 'empresa obrigatória' }, 400);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return json({ error: 'LOVABLE_API_KEY ausente' }, 500);

    const prompt = `Gere uma proposta comercial em HTML limpo (sem <html>, <head>, <body> — apenas o conteúdo interno) para a empresa "${empresa}" da 9FIT (healthtech brasileira). 

Estrutura obrigatória em 6 seções, cada uma como <section> com <h2>:
1. Headline (chamada forte)
2. Problema (dor da empresa)
3. Solução 9FIT
4. Entregáveis
5. Valor: R$ ${valor ?? 'a definir'}
6. CTA

Serviços contratados: ${JSON.stringify(servicos ?? [])}.
Contato: ${contato ?? '-'} (${email ?? '-'}).

Use tipografia simples, classes Tailwind se possível. Tom: profissional, confiante, direto. Português brasileiro.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'Você gera propostas B2B em HTML para a 9FIT. Devolve APENAS o HTML, sem comentários nem markdown.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (aiResp.status === 429) return json({ error: 'Limite de uso atingido.' }, 429);
    if (aiResp.status === 402) return json({ error: 'Créditos esgotados.' }, 402);
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error('AI gateway error:', aiResp.status, t);
      return json({ error: 'Erro no gateway IA' }, 500);
    }
    const data = await aiResp.json();
    const html: string = data.choices?.[0]?.message?.content ?? '';

    const { data: inserted, error: insertErr } = await supabase
      .from('propostas_b2b')
      .insert({ empresa, contato, email, telefone, servicos: servicos ?? [], valor, html, status: 'draft' })
      .select('*')
      .single();

    if (insertErr) {
      console.error('insert error:', insertErr);
      return json({ error: insertErr.message }, 500);
    }

    return json({ proposta: inserted });
  } catch (err) {
    console.error('proposta-b2b-generate error:', err);
    return json({ error: String(err instanceof Error ? err.message : err) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
