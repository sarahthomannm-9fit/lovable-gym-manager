import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { safeVideoUrl } from "@/lib/workout";
export type ExerciseExecution = {
  completed: boolean;
  carga: string;
  series?: string;
  repeticoes?: string;
  alternative_id?: string;
  deferred?: boolean;
};
export function WorkoutExecutionCard({
  exercise,
  index,
  value,
  disabled,
  onChange,
  facilities,
}: {
  facilities?: any[];
  exercise: any;
  index: number;
  value?: ExerciseExecution;
  disabled: boolean;
  onChange: (value: ExerciseExecution) => void;
}) {
  const row = value || { completed: false, carga: "" };
  const alternatives: any[] = exercise.alternativas || [];
  const actual =
    alternatives.find((a) => a.exercicio_id === row.alternative_id) || exercise;
  const unavailable = (e: any) => {
    const name = String(e.equipamento || "")
      .trim()
      .toLowerCase();
    if (
      !name ||
      ["nenhum", "peso corporal", "livre", "sem equipamento"].includes(name) ||
      !facilities
    )
      return false;
    return !facilities.some(
      (f) =>
        f.availability === "available" &&
        (f.nome.toLowerCase().includes(name) ||
          name.includes(f.nome.toLowerCase())),
    );
  };
  const choose = (id: string) => {
    if (
      (row.completed || row.carga || row.series || row.repeticoes) &&
      !confirm(
        "Trocar o exercício? O registro deste exercício será limpo para evitar atribuir a carga à opção errada.",
      )
    )
      return;
    onChange({
      completed: false,
      carga: "",
      series: "",
      repeticoes: "",
      alternative_id: id,
    });
  };
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold">
        {index + 1}. {actual.nome}
      </h2>
      {row.alternative_id && (
        <p className="text-sm">
          Alternativa aprovada para {exercise.nome}. Escolha somente nesta
          sessão.
        </p>
      )}
      {unavailable(actual) && (
        <p
          role="status"
          className="rounded border border-amber-500 p-3 text-sm"
        >
          O equipamento desta opção não consta como disponível na última
          consulta. Consulte uma alternativa aprovada ou deixe o exercício
          pendente.
        </p>
      )}
      <p className="font-medium">
        {actual.series} séries × {actual.repeticoes} · descanso{" "}
        {actual.descanso_seg ?? 0}s
      </p>
      <p>
        Carga prescrita:{" "}
        {actual.carga_kg == null
          ? "Conforme orientação do professor"
          : actual.carga_kg + " kg"}
      </p>
      {actual.instrucoes && (
        <p className="whitespace-pre-wrap text-sm">{actual.instrucoes}</p>
      )}
      {actual.observacoes && (
        <p className="whitespace-pre-wrap rounded bg-muted p-3 text-sm">
          {actual.observacoes}
        </p>
      )}
      <fieldset disabled={disabled} className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <label className="flex min-h-11 items-center gap-3">
            <Checkbox
              checked={row.completed}
              onCheckedChange={(v) =>
                onChange({ ...row, completed: v === true, deferred: false })
              }
            />
            Realizei este exercício
          </label>
          <Button
            variant="ghost"
            onClick={() =>
              onChange({ ...row, completed: false, deferred: !row.deferred })
            }
          >
            {row.deferred ? "Voltar a este exercício" : "Deixar para depois"}
          </Button>
        </div>
        {row.deferred && (
          <p role="status" className="text-sm">
            Pendente. Continue os próximos exercícios e volte quando puder.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["carga", "Carga realizada (kg)"],
            ["series", "Séries realizadas"],
            ["repeticoes", "Repetições realizadas"],
          ].map(([key, label]) => (
            <label key={key} className="text-sm">
              {label}
              <Input
                type="number"
                min="0"
                step={key === "series" ? "1" : "0.5"}
                max={key === "series" ? 100 : 100000}
                value={(row as any)[key] ?? ""}
                onChange={(e) => onChange({ ...row, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <details className="rounded border p-3">
          <summary className="min-h-11 cursor-pointer py-2 font-medium">
            Equipamento ocupado? Ver alternativa
          </summary>
          {alternatives.length ? (
            <div className="space-y-3">
              <p className="text-sm">
                Opções aprovadas pelo coach. Confira a prescrição própria antes
                de escolher.
              </p>
              {alternatives.map((a) => (
                <article
                  key={a.exercicio_id}
                  className="space-y-2 border-b py-3"
                >
                  <p className="font-medium">{a.nome}</p>
                  <p className="text-sm">
                    {a.series} × {a.repeticoes} ·{" "}
                    {a.carga_kg == null
                      ? "Carga conforme orientação"
                      : a.carga_kg + " kg"}{" "}
                    · descanso {a.descanso_seg}s
                  </p>
                  <Button
                    variant="outline"
                    disabled={
                      row.alternative_id === a.exercicio_id || unavailable(a)
                    }
                    onClick={() => choose(a.exercicio_id)}
                  >
                    {unavailable(a)
                      ? "Equipamento indisponível"
                      : row.alternative_id === a.exercicio_id
                        ? "Em uso nesta sessão"
                        : "Usar nesta sessão"}
                  </Button>
                </article>
              ))}
              {row.alternative_id && (
                <Button variant="ghost" onClick={() => choose("")}>
                  Voltar ao exercício principal
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm">
              Nenhuma alternativa aprovada. Você pode deixar este exercício
              pendente e continuar os demais, ou pedir orientação ao coach.
            </p>
          )}
        </details>
      </fieldset>
      <Button asChild variant="ghost">
        <Link to="/morador?tab=suporte&destino=treino_saude">
          Pedir orientação ao coach
        </Link>
      </Button>
      {safeVideoUrl(actual.video_url) && (
        <Button asChild variant="outline">
          <a
            href={safeVideoUrl(actual.video_url)!}
            target="_blank"
            rel="noreferrer"
          >
            Ver demonstração de {actual.nome}
          </a>
        </Button>
      )}
    </section>
  );
}
