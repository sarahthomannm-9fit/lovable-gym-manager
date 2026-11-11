import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { residentDate, residentStatus } from "@/lib/resident";
import { COMMON_AREAS } from "@/lib/operationalCatalog";
import { toast } from "sonner";
export function CommonAreaOperations({
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
    [filter, setFilter] = useState("pendentes");
  const lock = useRef(false);
  useEffect(() => {
    let live = true;
    setError("");
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("area_reservations")
          .select("*")
          .eq("organization_id", orgId)
          .order("starts_at", { ascending: false });
        if (error) throw error;
        if (live) setRows(data || []);
      } catch {
        if (live) setError("Não foi possível consultar as reservas.");
      }
    })();
    return () => {
      live = false;
    };
  }, [orgId, revision]);
  const act = async (id: string, complete: boolean) => {
    if (
      lock.current ||
      !confirm(
        complete
          ? "Confirmar que esta reserva foi utilizada?"
          : "Cancelar esta reserva?",
      )
    )
      return;
    lock.current = true;
    setBusy(true);
    try {
      const { error } = await (supabase as any).rpc(
        complete ? "complete_area_reservation" : "cancel_area_reservation",
        { p_id: id },
      );
      if (error) throw error;
      toast.success("Reserva atualizada.");
      setRevision((v) => v + 1);
    } catch (e) {
      toast.error((e as Error).message || "Falha ao confirmar.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const visible = rows?.filter(
    (r) => filter === "todos" || r.status === "confirmada",
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservas das áreas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <p role="alert">
            {error} Use Atualizar para tentar novamente. Os registros anteriores
            não foram reconfirmados.
          </p>
        )}
        {rows === null ? (
          !error && <p role="status">Carregando reservas…</p>
        ) : !visible?.length ? (
          <p>Nenhuma reserva neste filtro.</p>
        ) : (
          visible.map((row) => {
            const Wrapper = compact ? "details" : "div";
            return (
              <Wrapper key={row.id} className="space-y-3 rounded-lg border p-4">
                {compact ? (
                  <summary className="min-h-11 cursor-pointer py-2 font-medium">
                    {row.title} · {residentStatus[row.status] || row.status}
                  </summary>
                ) : (
                  <h3 className="font-medium">{row.title}</h3>
                )}
                <p className="text-sm">
                  {COMMON_AREAS[row.area_type] || row.area_type} ·{" "}
                  {residentStatus[row.status] || row.status}
                </p>
                <p className="text-sm">
                  {residentDate(row.starts_at, true)} até{" "}
                  {residentDate(row.ends_at, true)} · Brasília
                </p>
                {row.status === "confirmada" && (
                  <div className="flex flex-wrap gap-2">
                    {new Date(row.starts_at) > new Date() && (
                      <Button
                        disabled={busy}
                        variant="outline"
                        onClick={() => void act(row.id, false)}
                      >
                        Cancelar reserva
                      </Button>
                    )}
                    {new Date(row.ends_at) <= new Date() && (
                      <Button
                        disabled={busy}
                        onClick={() => void act(row.id, true)}
                      >
                        Registrar utilização
                      </Button>
                    )}
                  </div>
                )}
              </Wrapper>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
