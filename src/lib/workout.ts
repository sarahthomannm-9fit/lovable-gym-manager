export const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export type ExerciseDraft = {
  key: string; exercicio_id: string; nome: string; dia_semana: number;
  series: number; repeticoes: string; carga_kg: string; descanso_seg: number; observacoes: string;
};
export type WorkoutDraft = {
  requestId: string; aluno_id: string; nome: string; objetivo: string; nivel: string;
  data_inicio: string; semanas: number; exercicios: ExerciseDraft[];
};

export function localDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function validateWorkout(draft: WorkoutDraft): string | null {
  if (!draft.aluno_id) return 'Escolha o aluno.';
  if (!draft.nome.trim()) return 'Informe o nome do treino.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.data_inicio) || Number.isNaN(Date.parse(draft.data_inicio))) return 'Informe uma data válida.';
  if (!Number.isInteger(draft.semanas) || draft.semanas < 1 || draft.semanas > 52) return 'Escolha entre 1 e 52 semanas.';
  if (!draft.exercicios.length) return 'Adicione pelo menos um exercício.';
  for (const [i, ex] of draft.exercicios.entries()) {
    if (!ex.exercicio_id) return `Escolha o exercício ${i + 1}.`;
    if (!Number.isInteger(ex.dia_semana) || ex.dia_semana < 1 || ex.dia_semana > 7) return 'Escolha o dia de cada exercício.';
    if (!Number.isInteger(ex.series) || ex.series < 1 || ex.series > 30) return `Informe 1 a 30 séries no exercício ${i + 1}.`;
    if (!ex.repeticoes.trim()) return `Informe as repetições do exercício ${i + 1}.`;
    if (!Number.isFinite(ex.descanso_seg) || ex.descanso_seg < 0 || ex.descanso_seg > 1800) return 'Descanso deve ficar entre 0 e 1800 segundos.';
    if (ex.carga_kg !== '' && (!Number.isFinite(Number(ex.carga_kg)) || Number(ex.carga_kg) < 0)) return 'Carga deve ser zero ou positiva.';
  }
  return null;
}

export function publicationPayload(draft: WorkoutDraft) {
  return {
    aluno_id: draft.aluno_id, nome: draft.nome.trim(), objetivo: draft.objetivo.trim(),
    nivel: draft.nivel, data_inicio: draft.data_inicio, semanas: draft.semanas,
    exercicios: draft.exercicios.map((ex, i) => ({
      exercicio_id: ex.exercicio_id, dia_semana: ex.dia_semana, ordem: i + 1,
      series: ex.series, repeticoes: ex.repeticoes.trim(),
      carga_kg: ex.carga_kg === '' ? null : Number(ex.carga_kg),
      descanso_seg: ex.descanso_seg, observacoes: ex.observacoes.trim(),
    })),
  };
}

export type WorkoutExercise = {
  id: string; nome: string; series: number; repeticoes: string; carga_kg: number | null;
  descanso_seg: number; observacoes: string | null; instrucoes: string | null; video_url: string | null;
};
export type WorkoutSession = {
  id: string; status: 'em_andamento' | 'pausado' | 'concluido';
  progress: Record<string, { completed: boolean; carga: string }>; feedback: string | null;
};
export type StudentWorkout = {
  treino: { id: string; nome: string; descricao: string; data_inicio: string; data_fim: string | null } | null;
  exercicios: WorkoutExercise[]; session: WorkoutSession | null; data: string;
};

export function safeVideoUrl(value: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}
