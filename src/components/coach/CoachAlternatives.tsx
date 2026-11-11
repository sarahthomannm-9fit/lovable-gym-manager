import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ExerciseDraft, AlternativeDraft } from "@/lib/workout";
export function CoachAlternatives({
  exercise,
  library,
  unavailable,
  onChange,
}: {
  exercise: ExerciseDraft;
  library: { id: string; nome: string }[];
  unavailable: (e: any) => string;
  onChange: (rows: AlternativeDraft[]) => void;
}) {
  const [search, setSearch] = useState("");
  const rows = exercise.alternativas || [];
  const edit = (index: number, patch: Partial<AlternativeDraft>) =>
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  return (
    <details className="space-y-3 rounded-lg border p-3">
      <summary className="min-h-11 cursor-pointer py-2 font-medium">
        Alternativas para aparelho ocupado · {rows.length}/3
      </summary>
      <p className="text-sm text-muted-foreground">
        Aprovação para este morador. Defina parâmetros próprios; a carga do
        exercício principal não será copiada. Não é um fluxo de substituição por
        dor.
      </p>
      {rows.map((a, i) => (
        <fieldset key={a.exercicio_id} className="space-y-3 rounded border p-3">
          <legend className="font-medium">{a.nome}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              Séries
              <Input
                type="number"
                min="1"
                max="30"
                value={a.series}
                onChange={(e) => edit(i, { series: Number(e.target.value) })}
              />
            </label>
            <label>
              Repetições
              <Input
                maxLength={100}
                value={a.repeticoes}
                onChange={(e) => edit(i, { repeticoes: e.target.value })}
              />
            </label>
            <label>
              Carga própria (kg, opcional)
              <Input
                type="number"
                min="0"
                step="0.5"
                value={a.carga_kg}
                onChange={(e) => edit(i, { carga_kg: e.target.value })}
              />
            </label>
            <label>
              Descanso (segundos)
              <Input
                type="number"
                min="0"
                max="1800"
                value={a.descanso_seg}
                onChange={(e) =>
                  edit(i, { descanso_seg: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <label className="block">
            Orientação
            <Textarea
              maxLength={2000}
              value={a.observacoes}
              onChange={(e) => edit(i, { observacoes: e.target.value })}
            />
          </label>
          <Button
            variant="ghost"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
          >
            Remover alternativa
          </Button>
        </fieldset>
      ))}
      {rows.length < 3 && (
        <>
          <Input
            aria-label={"Buscar alternativa de " + exercise.nome}
            placeholder="Buscar alternativa na biblioteca"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search.trim().length >= 2 && (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {library
                .filter(
                  (e) =>
                    e.id !== exercise.exercicio_id &&
                    !rows.some((a) => a.exercicio_id === e.id) &&
                    e.nome.toLowerCase().includes(search.toLowerCase()),
                )
                .slice(0, 30)
                .map((e) => {
                  const why = unavailable(e);
                  return (
                    <div
                      key={e.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
                    >
                      <span>
                        {e.nome}
                        {why && <small className="block">{why}</small>}
                      </span>
                      <Button
                        variant="outline"
                        disabled={!!why}
                        onClick={() => {
                          onChange([
                            ...rows,
                            {
                              exercicio_id: e.id,
                              nome: e.nome,
                              series: 1,
                              repeticoes: "",
                              carga_kg: "",
                              descanso_seg: 0,
                              observacoes: "",
                            },
                          ]);
                          setSearch("");
                        }}
                      >
                        Adicionar alternativa
                      </Button>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </details>
  );
}
