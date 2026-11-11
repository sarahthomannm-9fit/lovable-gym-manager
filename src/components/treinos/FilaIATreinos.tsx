import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOperationalContext } from "@/hooks/useOperationalContext";
import { Button } from "@/components/ui/button";
import { residentDate } from "@/lib/resident";
export function FilaIATreinos({ onChange }: { onChange?: () => void } = {}) {
  const { activeOrg } = useOperationalContext();
  const [rows, setRows] = useState<any[] | null>(null),
    [names, setNames] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    setRows(null);
    setError("");
    if (!activeOrg) {
      setRows([]);
      return;
    }
    void (async () => {
      try {
        const { data, error } = await (supabase as any).rpc(
          "coach_operation_summary",
          { p_org: activeOrg.id },
        );
        if (error) throw error;
        if (live) {
          setRows(data.queue || []);
          setNames(
            Object.fromEntries(
              (data.students || []).map((s: any) => [s.id, s.nome]),
            ),
          );
        }
      } catch {
        if (live) setError("Não foi possível consultar a fila.");
      }
    })();
    return () => {
      live = false;
    };
  }, [activeOrg?.id, revision]);
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Avaliar e prescrever</h2>
        <Button
          variant="outline"
          onClick={() => {
            setRevision((v) => v + 1);
            onChange?.();
          }}
        >
          Atualizar fila
        </Button>
      </header>
      {error ? (
        <p role="alert">{error} Use Atualizar fila para tentar novamente.</p>
      ) : rows === null ? (
        <p role="status">Carregando fila…</p>
      ) : !rows.length ? (
        <p>Nenhuma pendência de triagem nesta consulta.</p>
      ) : (
        rows.map((row) => {
          const clinical = row.status === "rejeitado" || !row.anamnese_id;
          return (
            <article key={row.id} className="space-y-3 rounded-xl border p-5">
              <h3 className="font-semibold">
                {names[row.aluno_id] || "Morador autorizado"}
              </h3>
              <p className="text-sm">
                {clinical ? "Avaliação necessária" : "Prescrição para conferir"}{" "}
                · {residentDate(row.created_at, true)}
              </p>
              <Button asChild>
                <Link
                  to={
                    "/coach?student=" +
                    row.aluno_id +
                    (clinical ? "&section=avaliacao" : "")
                  }
                >
                  Abrir atendimento
                </Link>
              </Button>
              {!clinical && (
                <Button className="ml-2" variant="outline" asChild>
                  <Link
                    to={
                      "/coach/prescricao?student=" +
                      row.aluno_id +
                      "&queue=" +
                      row.id
                    }
                  >
                    Montar e conferir treino
                  </Link>
                </Button>
              )}
            </article>
          );
        })
      )}
    </section>
  );
}
