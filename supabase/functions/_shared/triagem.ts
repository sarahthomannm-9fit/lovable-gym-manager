import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export async function decideTriage(db: SupabaseClient, id: string, apiKey?: string) {
  const existing = await db.from('treinos_ia_fila').select('id').eq('anamnese_id', id).limit(1);
  if (existing.error) throw existing.error;
  if (existing.data.length) return true;

  const { data: form, error } = await db.from('anamnese_respostas')
    .select('aluno_id,respostas,alunos!inner(organization_id)')
    .eq('id', id).eq('status', 'preenchido').maybeSingle();
  if (error) throw error;
  if (!form) return false;
  const student = Array.isArray(form.alunos) ? form.alunos[0] : form.alunos;
  const org = student?.organization_id;
  if (!org) throw new Error('Missing organization');

  const answers = form.respostas ?? {};
  const normalize = (s: unknown) => typeof s === 'string'
    ? s.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase() : '';
  const parq = answers.par_q;
  let reason = '';
  if (!Array.isArray(parq) || parq.length !== 7 || !parq.every(
    (entry) => normalize(entry?.resposta) === 'nao',
  )) reason = 'PAR-Q positivo ou incompleto. Encaminhado para avaliação profissional.';

  if (!reason && answers.revisao_estruturada === true) reason = 'Triagem de segurança requer avaliação profissional.';
  if (!reason && ['restricoes', 'medicamentos', 'historico'].some((key) => {
    const value = normalize(answers[key]);
    return !['', '-', 'nao', 'nenhum', 'nenhuma', 'nao se aplica', 'n/a'].includes(value);
  })) reason = 'Informações adicionais de saúde requerem avaliação profissional.';

  const objective = normalize(answers.objetivos);
  const levelHint = normalize(answers.nivel) || objective;
  const level = /\bavancad[oa]\b/.test(levelHint) ? 'avançado'
    : /\bintermediari[oa]\b/.test(levelHint) ? 'intermediário' : 'iniciante';
  const goals = [
    ['Postural e mobilidade', /mobilidade|postura|alongamento/],
    ['Cardio', /cardio|condicionamento|resistencia aerobica/],
    ['Força', /\bforca\b/],
    ['Hipertrofia', /hipertrofia|massa muscular/],
    ['Emagrecimento', /emagrec|perder peso/],
    ['Funcional', /funcional/],
  ] as const;
  const goal = goals.find(([, pattern]) => pattern.test(objective))?.[0];
  let suggestion = {};
  if (!reason && goal) {
    const { data: templates, error: templateError } = await db.from('workout_protocol_templates')
      .select('id,nome,sessoes_semana,estrutura').eq('ativo', true).eq('objetivo', goal).eq('nivel', level)
      .or(`organization_id.eq.${org},organization_id.is.null`)
      .order('organization_id', { nullsFirst: false }).order('id').limit(20);
    if (templateError) throw templateError;
    if (templates.length) {
      const complete = templates.filter(template => {
        const exercises = template.estrutura?.exercicios;
        return Array.isArray(exercises) && exercises.length >= 3;
      });
      const candidates = complete.length ? complete : templates;
      let selected = candidates[0];
      if (apiKey) {
        try {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000),
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [{ role: 'user', content: JSON.stringify({
                tarefa: 'Selecione um protocolo compatível e devolva somente seu ID.',
                objetivo: goal, nivel: level, protocolos: candidates.map(({ id, nome, sessoes_semana }) => ({ id, nome, sessoes_semana })),
              }) }],
            }),
          });
          if (response.ok) {
            const result = await response.json();
            const chosen = result.choices?.[0]?.message?.content?.trim();
            selected = candidates.find((template) => template.id === chosen) ?? selected;
          }
        } catch {
          // The prefiltered catalog also provides a deterministic fallback.
        }
      }
      const structure = selected.estrutura;
      const configured = structure && typeof structure === 'object' && !Array.isArray(structure)
        ? structure.ajustes : undefined;
      suggestion = {
        protocol_template_id: selected.id,
        ajustes: configured && typeof configured === 'object' && !Array.isArray(configured) ? configured : {},
        sessoes_semana: selected.sessoes_semana,
      };
      reason = selected.nome;
    }
  }
  const matched = 'protocol_template_id' in suggestion;
  const { error: writeError } = await db.from('treinos_ia_fila').insert({
    anamnese_id: id, aluno_id: form.aluno_id, organization_id: org,
    objetivo: goal, nivel: level, sugestao: suggestion,
    resumo: reason || 'Sem protocolo compatível. Encaminhado para avaliação profissional.',
    status: matched ? 'pendente' : 'rejeitado',
  });
  if (writeError && writeError.code !== '23505') throw writeError;
  return true;
}
