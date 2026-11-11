import type { ExerciseDraft } from "./workout";
export function activeCoachWorkout(workout: any, today: string) {
  return (
    workout.status === "ativo" &&
    workout.published === true &&
    workout.data_inicio <= today &&
    (!workout.data_fim || workout.data_fim >= today)
  );
}
export function currentCoachWorkout(workouts: any[], today: string) {
  return workouts
    .filter((w) => activeCoachWorkout(w, today))
    .sort(
      (a, b) =>
        b.data_inicio.localeCompare(a.data_inicio) ||
        String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")) ||
        a.id.localeCompare(b.id),
    )[0];
}
export function workoutAttention(workout: any, activity: any, today: string) {
  if (!activeCoachWorkout(workout, today)) return "sem_plano";
  if (
    workout.data_fim &&
    workout.data_fim <=
      new Date(new Date(today + "T12:00:00Z").getTime() + 7 * 86400000)
        .toISOString()
        .slice(0, 10)
  )
    return "revisao";
  if (!activity?.completions) return "sem_primeira";
  if (
    !activity.last_session ||
    Date.parse(activity.last_session) <=
      Date.parse(today + "T12:00:00-03:00") - 14 * 86400000
  )
    return "sem_retorno";
  return "recente";
}
export function weeksDiffer(rows: any[]) {
  const comparable = (week: number) =>
    JSON.stringify(
      rows
        .filter((row) => row.semana === week)
        .map((row) => ({
          exercicio_id: row.exercicio_id,
          dia_semana: row.dia_semana,
          ordem: row.ordem,
          series: row.series,
          repeticoes: row.repeticoes,
          carga_kg: row.carga_kg ?? null,
          descanso_seg: row.descanso_seg,
          observacoes: row.observacoes ?? "",
          alternativas: row.alternativas ?? [],
        }))
        .sort(
          (a, b) =>
            a.dia_semana - b.dia_semana ||
            a.ordem - b.ordem ||
            a.exercicio_id.localeCompare(b.exercicio_id),
        ),
    );
  const weeks = [...new Set(rows.map((row) => row.semana))];
  return weeks.some((week) => comparable(week) !== comparable(1));
}
export function exerciseAvailability(
  exercise: any,
  equipment: string[],
  restrictions: string[],
) {
  if (!exercise.ativo) return "Exercício inativo";
  const normalized = (s: string) => s.toLocaleLowerCase().trim();
  if (
    (exercise.restricoes_incompativeis ?? []).some(
      (r: string) =>
        normalized(r) &&
        restrictions.some(
          (d) =>
            normalized(d) &&
            (normalized(r).includes(normalized(d)) ||
              normalized(d).includes(normalized(r))),
        ),
    )
  )
    return "Incompatibilidade com restrição informada";
  const need = normalized(exercise.equipamento ?? "");
  if (
    need &&
    !["nenhum", "peso corporal", "livre", "sem equipamento"].includes(need) &&
    !equipment.some(
      (item) =>
        normalized(item).includes(need) || need.includes(normalized(item)),
    )
  )
    return "Equipamento não aprovado no condomínio";
  return "";
}
export function validExerciseDrafts(rows: unknown): rows is ExerciseDraft[] {
  return (
    Array.isArray(rows) &&
    rows.every(
      (row) =>
        row &&
        typeof row.key === "string" &&
        typeof row.exercicio_id === "string" &&
        typeof row.nome === "string" &&
        typeof row.repeticoes === "string" &&
        typeof row.carga_kg === "string" &&
        typeof row.observacoes === "string" &&
        Number.isInteger(row.dia_semana) &&
        Number.isInteger(row.series) &&
        Number.isFinite(row.descanso_seg) &&
        (row.alternativas === undefined ||
          (Array.isArray(row.alternativas) &&
            row.alternativas.length <= 3 &&
            row.alternativas.every(
              (a: any) =>
                a &&
                typeof a.exercicio_id === "string" &&
                typeof a.nome === "string" &&
                typeof a.repeticoes === "string" &&
                typeof a.carga_kg === "string" &&
                typeof a.observacoes === "string" &&
                Number.isInteger(a.series) &&
                Number.isFinite(a.descanso_seg),
            ))),
    )
  );
}
