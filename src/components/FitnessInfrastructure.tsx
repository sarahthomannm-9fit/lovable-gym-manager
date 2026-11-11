import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
function displayHours(value: any): string {
  if (typeof value === "string") return value;
  if (value === false || value?.fechado === true) return "Fechado";
  if (Array.isArray(value)) return value.map(displayHours).join(" · ");
  if (value && typeof value === "object") {
    const start = value.inicio || value.abertura || value.start || value.abre;
    const end = value.fim || value.fechamento || value.end || value.fecha;
    return start && end ? start + "–" + end : "Consulte a administração";
  }
  return "Consulte a administração";
}
export function FitnessInfrastructure({
  orgId,
  manage = false,
}: {
  orgId: string;
  manage?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    if (!open) return;
    let live = true;
    setError("");
    void (async () => {
      try {
        const { data, error } = await (supabase as any).rpc(
          "fitness_infrastructure",
          { p_org: orgId },
        );
        if (error) throw error;
        if (live) setData(data);
      } catch {
        if (live) setError("Não foi possível consultar a infraestrutura.");
      }
    })();
    return () => {
      live = false;
    };
  }, [orgId, open, revision]);
  const update = async (row: any) => {
    if (lock.current) return;
    const available = row.availability !== "available";
    const note = prompt(
      available
        ? "Observação sobre a liberação (opcional)"
        : "Motivo público da indisponibilidade (sem dados pessoais ou de saúde):",
      available ? "" : row.note || "",
    );
    if (note === null) return;
    if (!available && note.trim().length < 3)
      return toast.error("Informe o motivo.");
    lock.current = true;
    setBusy(true);
    try {
      const { error } = await (supabase as any).rpc(
        "set_fitness_equipment_availability",
        { p_id: row.id, p_available: available, p_note: note },
      );
      if (error) throw error;
      setRevision((v) => v + 1);
      toast.success("Disponibilidade atualizada.");
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível confirmar.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <details
      className="space-y-4 rounded-xl border bg-card p-5"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="min-h-11 cursor-pointer py-2 text-lg font-semibold">
        Academia: infraestrutura e horários
      </summary>
      {open && (
        <>
          {error && (
            <div role="alert">
              {error}
              <Button
                variant="outline"
                onClick={() => setRevision((v) => v + 1)}
              >
                Tentar novamente
              </Button>
            </div>
          )}
          {!data ? (
            !error && <p role="status">Consultando…</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">
                Capacidade cadastrada:{" "}
                {data.capacity == null
                  ? "Não informada"
                  : data.capacity + " pessoas"}
                . Este valor não indica ocupação atual.
              </p>
              {data.hours && (
                <div className="space-y-1 text-sm">
                  <h3 className="font-medium">Horários cadastrados</h3>
                  {typeof data.hours === "object" ? (
                    Object.entries(data.hours).map(([day, times]) => (
                      <p key={day}>
                        {day}: {displayHours(times)}
                      </p>
                    ))
                  ) : (
                    <p>{String(data.hours)}</p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                {data.facilities.map((row: any) => (
                  <article
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {row.nome} · {row.quantidade} unidade(s)
                      </p>
                      <p className="text-sm">
                        {row.availability === "available"
                          ? "Disponível"
                          : "Indisponível"}
                        {row.note ? " · " + row.note : ""}
                      </p>
                    </div>
                    {manage && (
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => void update(row)}
                      >
                        {row.availability === "available"
                          ? "Registrar indisponibilidade"
                          : "Liberar equipamento"}
                      </Button>
                    )}
                  </article>
                ))}
                {!data.facilities.length && (
                  <p>Nenhum equipamento aprovado cadastrado.</p>
                )}
              </div>
              <section className="space-y-2 text-sm">
                <h3 className="font-medium">
                  Faixas com mais inícios de treino no app · últimos 30 dias
                </h3>
                <p className="text-muted-foreground">
                  Registros de sessões em Brasília. Não representam todas as
                  pessoas presentes nem medição de ocupação ao vivo.
                </p>
                {data.usage_hours.length ? (
                  data.usage_hours.slice(0, 3).map((r: any) => (
                    <p key={r.hour}>
                      {String(r.hour).padStart(2, "0")}h–
                      {String((r.hour + 1) % 24).padStart(2, "0")}h ·{" "}
                      {r.sessions} início(s)
                    </p>
                  ))
                ) : (
                  <p>Ainda não há registros para identificar faixas de uso.</p>
                )}
              </section>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => setRevision((v) => v + 1)}
              >
                Atualizar informações
              </Button>
            </div>
          )}
        </>
      )}
    </details>
  );
}
