import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

const isToken = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (!['GET', 'POST'].includes(req.method)) return json({ error: 'Método não permitido' }, 405);

  const input = req.method === 'GET'
    ? { token: new URL(req.url).searchParams.get('token') }
    : await req.json().catch(() => null);
  if (!input || !isToken(input.token)) return json({ error: 'Link inválido ou expirado' }, 404);

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const validSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db.from('anamnese_respostas')
    .select('id,status,alunos(nome)')
    .eq('token', input.token)
    .gte('created_at', validSince)
    .maybeSingle();
  if (error) return json({ error: 'Falha ao consultar questionário' }, 500);
  if (!data) return json({ error: 'Link inválido ou expirado' }, 404);
  if (data.status !== 'pendente') return json({ status: 'already' });

  if (req.method === 'GET') {
    const aluno = Array.isArray(data.alunos) ? data.alunos[0] : data.alunos;
    return json({ status: 'form', nome: aluno?.nome || 'Aluno' });
  }

  const answers = input.respostas;
  if (!answers || !Array.isArray(answers.par_q) || answers.par_q.length !== 7 ||
      !answers.par_q.every((entry: unknown) =>
        !!entry && typeof entry === 'object' &&
        ['sim', 'nao'].includes((entry as { resposta?: string }).resposta || ''))) {
    return json({ error: 'Responda às sete perguntas' }, 400);
  }
  const extras = ['objetivos', 'restricoes', 'medicamentos', 'historico'] as const;
  if (extras.some((field) => typeof answers[field] !== 'string' || answers[field].length > 4000)) {
    return json({ error: 'Informações adicionais inválidas' }, 400);
  }
  const respostas = {
    par_q: answers.par_q.map((entry: { pergunta?: string; resposta: string }) => ({
      pergunta: String(entry.pergunta || '').slice(0, 500),
      resposta: entry.resposta,
    })),
    ...Object.fromEntries(extras.map((field) => [field, answers[field]])),
  };
  const { data: saved, error: saveError } = await db.from('anamnese_respostas')
    .update({ respostas, status: 'preenchido', preenchido_em: new Date().toISOString() })
    .eq('id', data.id)
    .eq('status', 'pendente')
    .select('id')
    .maybeSingle();
  if (saveError) return json({ error: 'Falha ao salvar questionário' }, 500);
  if (!saved) return json({ status: 'already' }, 409);
  return json({ status: 'done' });
});

