import { PAR_Q_QUESTIONS } from "@/lib/parq";
import { residentDate } from "@/lib/resident";
const text = (value: unknown): string =>
  value === null || value === undefined || value === ""
    ? "Não informado"
    : Array.isArray(value)
      ? value.length
        ? value.map(text).join(", ")
        : "Nenhum informado"
      : typeof value === "boolean"
        ? value
          ? "Sim"
          : "Não"
        : String(value);
export function HealthCapture({
  capture,
  safety,
}: {
  capture: any;
  safety: any;
}) {
  const source = capture?.respostas;
  const health = source?.captura ?? source ?? safety;
  if (!health)
    return <p>Nenhuma captura de saúde disponível para este atendimento.</p>;
  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {capture
          ? "Captura enviada em " + residentDate(capture.preenchido_em, true)
          : "Registro legado de segurança; captura original indisponível"}
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {[
          ["Objetivo", health.objetivo ?? health.objetivos],
          ["Experiência", health.nivel ?? source?.nivel],
          ["Medicamentos", health.medicamentos ?? source?.medicamentos],
          ["Restrições", health.restricoes],
          ["Lesões atuais", health.lesoes_atuais ?? health.lesoes],
          ["Histórico", health.historico_lesoes ?? health.historico],
          ["Cirurgias", health.cirurgias],
          ["Dor atual", health.dor_atual],
          ["Sinais de alerta", health.sinais_alerta],
          ["Observações", health.observacoes],
          ["Consentimento", health.consentimento],
        ].map(([label, value], i) => (
          <div key={i} className="rounded-lg border p-3">
            <dt className="text-sm text-muted-foreground">{String(label)}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words">
              {text(value)}
            </dd>
          </div>
        ))}
      </dl>
      <h3 className="font-semibold">PAR-Q da captura</h3>
      <ol className="space-y-2">
        {PAR_Q_QUESTIONS.map((question, i) => {
          const answer = (source?.par_q ?? health.par_q)?.[i]?.resposta;
          return (
            <li key={question} className="rounded border p-3 text-sm">
              {question}
              <strong className="mt-1 block">
                {answer === "sim"
                  ? "Sim"
                  : answer === "nao"
                    ? "Não"
                    : "Não informado"}
              </strong>
            </li>
          );
        })}
      </ol>
      {safety && (
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p>Avaliação atual: {text(safety.risco)}</p>
          <p>Justificativa profissional: {text(safety.review_notes)}</p>
          {safety.validado_em && (
            <p>Registrada em {residentDate(safety.validado_em, true)}</p>
          )}
        </div>
      )}
    </section>
  );
}
