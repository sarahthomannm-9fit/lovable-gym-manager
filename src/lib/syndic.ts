export function csvCell(value: unknown) {
  let text = String(value ?? "")
    .split(String.fromCharCode(0))
    .join("");
  if (/^[\s\uFEFF]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))
    text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function participantsCsv(
  event: { id: string; nome: string },
  rows: any[],
  exportedAt: string,
) {
  return (
    "\uFEFF" +
    [
      "evento_id,evento,nome,email,situacao,presenca_em,exportado_em",
      ...rows.map((row) =>
        [
          event.id,
          event.nome,
          row.nome ?? row.alunos?.nome ?? "",
          row.email ?? row.alunos?.email ?? "",
          row.status,
          row.checkin_at ?? "",
          exportedAt,
        ]
          .map(csvCell)
          .join(","),
      ),
    ].join("\r\n")
  );
}
export const eventStatus: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
  confirmado: "Vaga confirmada",
  lista_espera: "Lista de espera",
  checkin: "Presença registrada",
};
