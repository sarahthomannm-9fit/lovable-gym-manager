export const RESIDENT_TIME_ZONE = "America/Sao_Paulo";
// Datetime-local controls represent the condominium's clock, regardless of the device zone.
export function residentInstant(value: string) {
  return new Date(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)
      ? value + "-03:00"
      : NaN,
  );
}
export function residentDate(
  value: string | null | undefined,
  withTime = false,
) {
  if (!value) return "A confirmar";
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? value + "T12:00:00-03:00" : value,
  );
  if (!Number.isFinite(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: RESIDENT_TIME_ZONE,
    dateStyle: "short",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(date);
}
export function monthBounds(today: string) {
  const [year, month] = today.split("-").map(Number);
  const prefix = (y: number, m: number) =>
    `${y}-${String(m).padStart(2, "0")}-01`;
  return {
    start: prefix(year, month),
    next: month === 12 ? prefix(year + 1, 1) : prefix(year, month + 1),
    previous: month === 1 ? prefix(year - 1, 12) : prefix(year, month - 1),
  };
}
export const paymentPending = (status: string) =>
  ["pendente", "atrasado", "vencido"].includes(status);
export const residentStatus: Record<string, string> = {
  confirmado: "Inscrição confirmada",
  lista_espera: "Lista de espera",
  checkin: "Presença registrada",
  cancelado: "Cancelado",
  cancelada: "Cancelada",
  confirmada: "Confirmada",
  inscrito: "Inscrito",
  presente: "Presença registrada",
  solicitada: "Solicitação enviada",
  cotada: "Proposta para sua aprovação",
  concluida: "Concluída",
  concluido: "Concluído",
  sent: "Solicitação enviada",
  unknown: "Confirmação pendente",
  cancel_requested: "Cancelamento solicitado",
};
