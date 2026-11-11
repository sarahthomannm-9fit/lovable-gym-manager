import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { residentDate, residentInstant, residentStatus } from "@/lib/resident";
import { RESIDENT_SERVICES } from "@/lib/operationalCatalog";
import { useResidentDraftGuard } from "@/hooks/useResidentDraftGuard";
import { toast } from "sonner";
export function ServiceRequestsBoard({
  orgId,
  compact = false,
}: {
  orgId: string;
  compact?: boolean;
}) {
  const [rows, setRows] = useState<any[] | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0),
    [filter, setFilter] = useState("pendentes"),
    [drafts, setDrafts] = useState<
      Record<string, { value: string; owner: string; date: string }>
    >({});
  const lock = useRef(false);
  useResidentDraftGuard(Object.keys(drafts).length > 0);
  useEffect(() => {
    let live = true;
    setError("");
    void (async () => {
      try {
        const { data, error } = await (supabase as any).rpc(
          "operational_service_requests",
          { p_org_id: orgId },
        );
        if (error) throw error;
        if (live) setRows(data || []);
      } catch {
        if (live) setError("Não foi possível consultar solicitações.");
      }
    })();
    return () => {
      live = false;
    };
  }, [orgId, revision]);
  const action = async (
    name: string,
    payload: Record<string, unknown>,
    id: string,
  ) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const { error } = await (supabase as any).rpc(name, payload);
      if (error) throw error;
      setDrafts((old) => {
        const next = { ...old };
        delete next[id];
        return next;
      });
      setRevision((v) => v + 1);
      toast.success("Atualização confirmada.");
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível confirmar.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const visible = rows?.filter(
    (r) =>
      filter === "todos" ||
      ["solicitada", "cotada", "confirmada"].includes(r.status),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitações de serviços</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          O morador precisa aceitar a proposta. Horário solicitado não é
          agendamento confirmado. O servidor valida valores, permissões e
          cancelamento de cobranças.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "pendentes" ? "default" : "outline"}
            onClick={() => setFilter("pendentes")}
          >
            Em andamento
          </Button>
          <Button
            variant={filter === "todos" ? "default" : "outline"}
            onClick={() => setFilter("todos")}
          >
            Histórico
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => setRevision((v) => v + 1)}
          >
            Atualizar
          </Button>
        </div>
        {error && (
          <p role="alert">{error} Use Atualizar para tentar novamente.</p>
        )}
        {rows === null ? (
          !error && <p role="status">Carregando solicitações…</p>
        ) : !visible?.length ? (
          <p>Nenhuma solicitação neste filtro.</p>
        ) : (
          visible.map((row) => {
            const d = drafts[row.id] || {
              value: row.quoted_value == null ? "" : String(row.quoted_value),
              owner: row.assigned_to || "",
              date: "",
            };
            const patch = (value: Partial<typeof d>) =>
              setDrafts((old) => ({ ...old, [row.id]: { ...d, ...value } }));
            const Wrapper = compact ? "details" : "div";
            return (
              <Wrapper key={row.id} className="space-y-3 rounded-lg border p-4">
                {compact ? (
                  <summary className="min-h-11 cursor-pointer py-2 font-medium">
                    {row.alunos?.nome || "Morador"} ·{" "}
                    {RESIDENT_SERVICES[row.service_type] || row.service_type} ·{" "}
                    {residentStatus[row.status] || row.status}
                  </summary>
                ) : (
                  <h3 className="font-medium">
                    {row.alunos?.nome || "Morador"} · {row.service_type} ·{" "}
                    {row.status}
                  </h3>
                )}
                {row.preferred_at && (
                  <p className="text-sm">
                    {row.status === "confirmada"
                      ? "Horário confirmado"
                      : "Horário solicitado/proposto"}
                    : {residentDate(row.preferred_at, true)} · Brasília
                  </p>
                )}
                {row.quoted_value != null && (
                  <p className="text-sm">
                    Proposta:{" "}
                    {Number(row.quoted_value).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}{" "}
                    · {row.assigned_to || "Responsável não informado"}
                  </p>
                )}
                {["solicitada", "cotada"].includes(row.status) && (
                  <fieldset
                    disabled={busy}
                    className="grid gap-3 sm:grid-cols-3"
                  >
                    <label className="text-sm">
                      Valor
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={d.value}
                        onChange={(e) => patch({ value: e.target.value })}
                      />
                    </label>
                    <label className="text-sm">
                      Responsável
                      <Input
                        maxLength={200}
                        value={d.owner}
                        onChange={(e) => patch({ owner: e.target.value })}
                      />
                    </label>
                    <label className="text-sm">
                      Horário proposto · Brasília
                      <Input
                        type="datetime-local"
                        value={d.date}
                        onChange={(e) => patch({ date: e.target.value })}
                      />
                    </label>
                    <Button
                      onClick={() => {
                        const value = Number(d.value);
                        if (
                          !d.value.trim() ||
                          !Number.isFinite(value) ||
                          value < 0 ||
                          d.owner.trim().length < 2
                        )
                          return toast.error("Confira valor e responsável.");
                        if (
                          d.date &&
                          (!Number.isFinite(
                            residentInstant(d.date).getTime(),
                          ) ||
                            residentInstant(d.date) <= new Date())
                        )
                          return toast.error("Informe horário futuro.");
                        if (
                          confirm(
                            "Enviar esta proposta para aceite do morador?",
                          )
                        )
                          void action(
                            "quote_service_request",
                            {
                              p_id: row.id,
                              p_value: value,
                              p_assigned_to: d.owner.trim(),
                              p_preferred_at: d.date
                                ? residentInstant(d.date).toISOString()
                                : row.preferred_at || null,
                            },
                            row.id,
                          );
                      }}
                    >
                      Confirmar proposta
                    </Button>
                  </fieldset>
                )}
                <div className="flex flex-wrap gap-2">
                  {row.status === "confirmada" && (
                    <Button
                      disabled={busy}
                      onClick={() => {
                        if (confirm("Confirmar que o serviço foi realizado?"))
                          void action(
                            "transition_service_request",
                            { p_id: row.id, p_action: "complete" },
                            row.id,
                          );
                      }}
                    >
                      Registrar conclusão
                    </Button>
                  )}
                  {["solicitada", "cotada", "confirmada"].includes(
                    row.status,
                  ) && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        if (
                          confirm(
                            "Cancelar solicitação? Pagamentos confirmados exigem tratamento pela administração.",
                          )
                        )
                          void action(
                            "transition_service_request",
                            { p_id: row.id, p_action: "cancel" },
                            row.id,
                          );
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </Wrapper>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
