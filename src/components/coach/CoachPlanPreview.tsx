import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { WEEKDAYS } from "@/lib/workout";

export function CoachPlanPreview({ planId }: { planId: string | null }) {
  const [open, setOpen] = useState(false),
    [rows, setRows] = useState<any[] | null>(null),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [week, setWeek] = useState(1);
  useEffect(() => {
    if (!open) return;
    let live = true;
    setRows(null);
    setError("");
    void (async () => {
      try {
        if (!planId) throw new Error("Plano sem programação vinculada.");
        const { data, error } = await (supabase as any)
          .from("plano_exercicios")
          .select(
            "id,semana,dia_semana,ordem,series,repeticoes,carga_kg,descanso_seg,observacoes,alternativas,exercicios_biblioteca(nome,instrucoes)",
          )
          .eq("plano_treino_id", planId)
          .order("semana")
          .order("dia_semana")
          .order("ordem");
        if (error) throw error;
        const ids = [
          ...new Set(
            (data || []).flatMap((r: any) =>
              (r.alternativas || []).map((a: any) => a.exercicio_id),
            ),
          ),
        ];
        let names: any[] = [];
        if (ids.length) {
          const result = await (supabase as any)
            .from("exercicios_biblioteca")
            .select("id,nome")
            .in("id", ids);
          if (result.error) throw result.error;
          names = result.data || [];
        }
        for (const row of data || [])
          row.alternativas = (row.alternativas || []).map((a: any) => ({
            ...a,
            nome:
              names.find((n) => n.id === a.exercicio_id)?.nome ||
              "Alternativa fora do catálogo",
          }));
        if (live) {
          setRows(data || []);
          setWeek(data?.[0]?.semana || 1);
        }
      } catch (e) {
        if (live)
          setError(
            (e as Error).message || "Não foi possível consultar a prescrição.",
          );
      }
    })();
    return () => {
      live = false;
    };
  }, [open, planId, revision]);
  return (
    <details
      className="rounded-lg border p-3"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="min-h-11 cursor-pointer py-2 font-medium">
        Ver prescrição completa
      </summary>
      {open &&
        (error ? (
          <div role="alert">
            <p>{error}</p>
            <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
              Tentar novamente
            </Button>
          </div>
        ) : rows === null ? (
          <p role="status">Carregando semanas do plano…</p>
        ) : !rows.length ? (
          <p>Nenhum exercício registrado neste plano.</p>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm">
              Semana
              <select
                className="ml-2 min-h-11 rounded border bg-background p-2"
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
              >
                {[...new Set(rows.map((r) => r.semana))].map((w) => (
                  <option key={w} value={w}>
                    Semana {w}
                  </option>
                ))}
              </select>
            </label>
            {WEEKDAYS.map((name, index) => {
              const exercises = rows.filter(
                (r) => r.semana === week && r.dia_semana === index + 1,
              );
              return exercises.length ? (
                <section key={name} className="space-y-2">
                  <h4 className="font-semibold">{name}</h4>
                  {exercises.map((row) => (
                    <article
                      key={row.id}
                      className="rounded bg-muted p-3 text-sm"
                    >
                      <p className="font-medium">
                        {row.exercicios_biblioteca?.nome ||
                          "Exercício não disponível no catálogo"}
                      </p>
                      <p>
                        {row.series} × {row.repeticoes} ·{" "}
                        {row.carga_kg === null
                          ? "Carga não informada"
                          : row.carga_kg + " kg"}{" "}
                        · Descanso {row.descanso_seg}s
                      </p>
                      {(row.alternativas || []).map((a: any) => (
                        <p key={a.exercicio_id}>
                          Alternativa aprovada: {a.nome} · {a.series} ×{" "}
                          {a.repeticoes} ·{" "}
                          {a.carga_kg == null
                            ? "Carga orientada"
                            : a.carga_kg + " kg"}{" "}
                          · descanso {a.descanso_seg}s · {a.observacoes}
                        </p>
                      ))}
                      <p className="whitespace-pre-wrap">
                        {row.observacoes || "Sem orientação adicional"}
                      </p>
                    </article>
                  ))}
                </section>
              ) : null;
            })}
          </div>
        ))}
    </details>
  );
}
