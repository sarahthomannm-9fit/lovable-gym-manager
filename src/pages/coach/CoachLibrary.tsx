import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function CoachLibrary({
  organizationId,
  students,
}: {
  organizationId: string;
  students: any[];
}) {
  const [params, setParams] = useSearchParams();
  const kind = params.get("kind") || "protocolos";
  const [protocols, setProtocols] = useState<any[]>([]),
    [exercises, setExercises] = useState<any[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0),
    [search, setSearch] = useState(""),
    [student, setStudent] = useState("");
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    setProtocols([]);
    setExercises([]);
    void (async () => {
      try {
        const db = supabase as any;
        const [p, e] = await Promise.all([
          db
            .from("workout_protocol_templates")
            .select("id,nome,objetivo,nivel,estrutura")
            .eq("ativo", true)
            .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
            .order("nome"),
          db
            .from("exercicios_biblioteca")
            .select("id,nome,grupo_muscular,equipamento,instrucoes")
            .eq("ativo", true)
            .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
            .order("nome"),
        ]);
        if (p.error || e.error) throw p.error || e.error;
        if (live) {
          setProtocols(p.data || []);
          setExercises(e.data || []);
        }
      } catch {
        if (live) setError("Não foi possível consultar a biblioteca.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [organizationId, revision]);
  const filtered = (kind === "protocolos" ? protocols : exercises).filter(
    (row) =>
      [row.nome, row.objetivo, row.grupo_muscular, row.equipamento]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Biblioteca</h2>
        <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
          Atualizar
        </Button>
      </header>
      <p className="text-sm text-muted-foreground">
        Protocolo é um modelo reutilizável. Plano é a prescrição individual
        publicada. A compatibilidade e as variáveis individuais são conferidas
        no editor.
      </p>
      <div className="flex flex-wrap gap-2">
        {["protocolos", "exercicios"].map((value) => (
          <Button
            key={value}
            variant={kind === value ? "default" : "outline"}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set("kind", value);
              setParams(next);
            }}
          >
            {value === "protocolos" ? "Protocolos" : "Exercícios"}
          </Button>
        ))}
      </div>
      <Input
        aria-label="Buscar na biblioteca"
        placeholder="Buscar por nome, objetivo ou equipamento"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {kind === "protocolos" && (
        <label className="block text-sm">
          Preparar protocolo para
          <select
            className="mt-1 min-h-11 w-full rounded border bg-background p-2"
            value={student}
            onChange={(e) => setStudent(e.target.value)}
          >
            <option value="">Escolha um morador autorizado</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </label>
      )}
      {loading ? (
        <p role="status">Carregando biblioteca…</p>
      ) : error ? (
        <p role="alert">{error} Use Atualizar para tentar novamente.</p>
      ) : !filtered.length ? (
        <p>Nenhum resultado para esta busca.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((row) => (
            <article key={row.id} className="space-y-3 rounded-xl border p-5">
              <h3 className="text-lg font-semibold">{row.nome}</h3>
              <p className="text-sm">
                {kind === "protocolos"
                  ? row.objetivo + " · " + row.nivel
                  : (row.grupo_muscular || "Grupo não informado") +
                    " · " +
                    (row.equipamento || "Sem equipamento")}
              </p>
              {kind === "protocolos" ? (
                <>
                  <p className="text-sm">
                    {Array.isArray(row.estrutura?.exercicios)
                      ? row.estrutura.exercicios.length
                      : 0}{" "}
                    exercícios no modelo. Cargas e orientações pessoais serão
                    definidas na montagem.
                  </p>
                  {student ? (
                    <Button asChild variant="outline">
                      <Link
                        to={
                          "/coach/prescricao?student=" +
                          student +
                          "&protocol=" +
                          row.id +
                          "&return=" +
                          encodeURIComponent("/coach?" + params.toString())
                        }
                      >
                        Usar no atendimento
                      </Link>
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Escolha o morador acima para iniciar a montagem.
                    </p>
                  )}
                </>
              ) : (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {row.instrucoes || "Sem instruções adicionais no catálogo"}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
