import { PageIntro } from "@/components/visual/LivingIdentity";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PersonaLayout, PersonaEmptyState } from "@/layouts/PersonaLayout";
import { useOperationalContext } from "@/hooks/useOperationalContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localDate } from "@/lib/workout";
import { residentDate } from "@/lib/resident";
import {
  activeCoachWorkout,
  currentCoachWorkout,
  workoutAttention,
} from "@/lib/coach";
import { CoachCase } from "./CoachCase";
import { CoachAgenda } from "./CoachAgenda";
import { CoachLibrary } from "./CoachLibrary";
const labels: Record<string, string> = {
  todos: "Todos",
  avaliacao: "Avaliação",
  prescricao: "Prescrição",
  sem_plano: "Sem plano vigente",
  sem_primeira: "Sem primeira conclusão",
  sem_retorno: "Sem retorno há 14 dias",
  revisao: "Plano perto do fim",
  feedback: "Execuções e relatos para acompanhar",
  recente: "Conclusão recente",
  vencido: "Plano vencido",
};
export default function CoachHome() {
  const { activeOrg } = useOperationalContext();
  const [params, setParams] = useSearchParams();
  const view = params.get("view") || "atendimentos",
    studentId = params.get("student"),
    filter = params.get("filter") || "todos",
    search = params.get("search") || "";
  const [data, setData] = useState<any>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const position = useRef(0);
  const restorePosition = useRef(false);
  useEffect(() => {
    if (!loading && !studentId && restorePosition.current) {
      restorePosition.current = false;
      requestAnimationFrame(() => window.scrollTo({ top: position.current }));
    }
  }, [loading, studentId]);
  useEffect(() => {
    if (!activeOrg) {
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    setData(null);
    setError("");
    void (async () => {
      try {
        const { data, error } = await (supabase as any).rpc(
          "coach_operation_summary",
          { p_org: activeOrg.id },
        );
        if (error || !Array.isArray(data?.students)) throw error || new Error();
        if (live) setData(data);
      } catch {
        if (live)
          setError(
            "Não foi possível carregar a operação deste condomínio. Nenhuma ausência de pendência foi confirmada.",
          );
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [activeOrg?.id, revision]);
  const patch = (values: Record<string, string | null>, replace = false) => {
    const next = new URLSearchParams(params);
    Object.entries(values).forEach(([k, v]) =>
      v === null ? next.delete(k) : next.set(k, v),
    );
    setParams(next, { replace });
  };
  const selectStudent = (id: string, section?: string) => {
    position.current = window.scrollY;
    patch({ student: id, section: section || null });
    window.scrollTo({ top: 0 });
  };
  const back = () => {
    restorePosition.current = true;
    setLoading(true);
    patch({ student: null, section: null });
    setRevision((v) => v + 1);
  };
  if (!activeOrg)
    return (
      <PersonaLayout title="Central do professor">
        <PersonaEmptyState message="Selecione um condomínio autorizado para iniciar o atendimento." />
      </PersonaLayout>
    );
  if (studentId)
    return (
      <PersonaLayout title="Atendimento do morador">
        <CoachCase
          key={activeOrg.id + ":" + studentId}
          studentId={studentId}
          organizationId={activeOrg.id}
          onBack={back}
        />
      </PersonaLayout>
    );
  const students: any[] = data?.students || [],
    workouts: any[] = data?.workouts || [],
    activity: any[] = data?.activity || [],
    queue: any[] = data?.queue || [],
    feedbacks: any[] = data?.feedbacks || [];
  const today = localDate();
  const caseRows = students.map((s) => {
    const w = currentCoachWorkout(
      workouts.filter((w) => w.aluno_id === s.id),
      today,
    );
    const q = queue.find((q) => q.aluno_id === s.id);
    const feedback = feedbacks.filter(
      (f) => f.aluno_id === s.id && !f.resolved,
    );
    const attention =
      !w &&
      workouts.some(
        (w) =>
          w.aluno_id === s.id &&
          w.status === "ativo" &&
          w.published &&
          w.data_fim &&
          w.data_fim < today,
      )
        ? "vencido"
        : workoutAttention(
            w || {},
            activity.find((a) => a.treino_id === w?.id),
            today,
          );
    const clinical = q && (q.status === "rejeitado" || !q.anamnese_id);
    return { ...s, workout: w, queue: q, feedback, attention, clinical };
  });
  const visible = caseRows
    .filter(
      (s) =>
        s.nome.toLowerCase().includes(search.toLowerCase()) &&
        (view === "moradores" ||
          filter === "todos" ||
          (filter === "avaliacao" && s.clinical) ||
          (filter === "prescricao" && s.queue && !s.clinical) ||
          (filter === "feedback" && s.feedback.length) ||
          s.attention === filter),
    )
    .sort(
      (a, b) =>
        Number(!!b.clinical) - Number(!!a.clinical) ||
        Number(!!b.queue) - Number(!!a.queue) ||
        (a.queue?.created_at || "9999").localeCompare(
          b.queue?.created_at || "9999",
        ) ||
        a.nome.localeCompare(b.nome),
    );
  const editor = (s: any) =>
    "/coach/prescricao?student=" +
    s.id +
    (s.queue && !s.clinical ? "&queue=" + s.queue.id : "") +
    "&return=" +
    encodeURIComponent("/coach?" + params.toString());
  return (
    <PersonaLayout
      title="Central do professor"
      subtitle="Avaliar, prescrever e acompanhar"
    >
      <div className="mx-auto max-w-6xl space-y-5">
        <PageIntro
          eyebrow={"Coach · " + activeOrg.nome}
          title={
            view === "moradores"
              ? "Pessoas no centro."
              : view === "agenda"
                ? "Seu tempo, bem organizado."
                : view === "biblioteca"
                  ? "Repertório para evoluir."
                  : "Orientar. Acompanhar. Evoluir."
          }
          description={
            view === "moradores"
              ? "Cada morador, uma jornada. Acesse avaliações, planos e acompanhamento."
              : view === "agenda"
                ? "Sua programação e os próximos encontros em um só lugar."
                : view === "biblioteca"
                  ? "Exercícios e protocolos para uma prescrição com intenção."
                  : "Uma visão clara de quem precisa de atenção e do próximo passo de cada atendimento."
          }
          compact={view !== "atendimentos" && view !== "" && Boolean(view)}
          actions={
            <Button
              disabled={loading}
              onClick={() => setRevision((v) => v + 1)}
            >
              Atualizar operação
            </Button>
          }
        />
        {loading ? (
          <p role="status">Consultando a operação autorizada…</p>
        ) : error ? (
          <div role="alert" className="space-y-3 rounded-xl border p-5">
            <p>{error}</p>
            <Button onClick={() => setRevision((v) => v + 1)}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            {view === "agenda" ? (
              <CoachAgenda
                key={activeOrg.id}
                organizationId={activeOrg.id}
                students={students}
              />
            ) : view === "biblioteca" ? (
              <CoachLibrary
                key={activeOrg.id}
                organizationId={activeOrg.id}
                students={students}
              />
            ) : (
              <>
                {view === "atendimentos" && (
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      [
                        "avaliacao",
                        "Avaliações",
                        caseRows.filter((s) => s.clinical).length,
                      ],
                      [
                        "prescricao",
                        "Prescrições",
                        caseRows.filter((s) => s.queue && !s.clinical).length,
                      ],
                      [
                        "feedback",
                        "Feedbacks",
                        caseRows.reduce((n, s) => n + s.feedback.length, 0),
                      ],
                      [
                        "revisao",
                        "Planos perto do fim",
                        caseRows.filter((s) => s.attention === "revisao")
                          .length,
                      ],
                    ].map(([value, label, count]) => (
                      <button
                        key={String(value)}
                        className="rounded-xl border bg-card p-4 text-left focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => patch({ filter: String(value) })}
                      >
                        <span className="block text-sm text-muted-foreground">
                          {label}
                        </span>
                        <strong className="mt-1 block text-2xl">{count}</strong>
                      </button>
                    ))}
                  </div>
                )}
                <Input
                  aria-label="Buscar morador"
                  placeholder="Buscar morador pelo nome"
                  value={search}
                  onChange={(e) => patch({ search: e.target.value }, true)}
                />
                {view === "atendimentos" && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(labels).map(([value, label]) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={filter === value ? "default" : "outline"}
                        onClick={() => patch({ filter: value })}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Carteira definida pelas permissões do servidor. Pendências de
                  triagem mais antigas aparecem primeiro. Presença no condomínio
                  não equivale a sessão concluída. Feedbacks: até 100 registros
                  recentes.
                </p>
                {!visible.length ? (
                  <div className="rounded-xl border border-dashed p-8">
                    <p>Nenhum morador neste filtro.</p>
                    <Button
                      className="mt-3"
                      variant="outline"
                      onClick={() => patch({ filter: "todos", search: null })}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {visible.map((s) => (
                      <article
                        key={s.id}
                        className="space-y-3 rounded-xl border bg-card p-5"
                      >
                        <header>
                          <h2 className="text-xl font-semibold">{s.nome}</h2>
                          <p className="text-sm text-muted-foreground">
                            {s.status} · {s.lifecycle_status}
                          </p>
                        </header>
                        {s.queue ? (
                          <div>
                            <p className="font-medium">
                              {s.clinical
                                ? "Avaliação profissional necessária"
                                : "Prescrição para conferir"}
                            </p>
                            <p className="text-sm">
                              Recebido em{" "}
                              {residentDate(s.queue.created_at, true)} ·{" "}
                              {s.queue.objetivo || "Objetivo a consultar"}
                            </p>
                          </div>
                        ) : (
                          <p>{labels[s.attention]}</p>
                        )}
                        {s.workout && (
                          <p className="text-sm">
                            Plano: {s.workout.nome} · término{" "}
                            {residentDate(s.workout.data_fim)}
                          </p>
                        )}
                        {s.feedback.length > 0 && (
                          <p className="text-sm">
                            {s.feedback.length} registro(s) com atendimento
                            ainda não concluído.
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() =>
                              selectStudent(
                                s.id,
                                s.clinical
                                  ? "avaliacao"
                                  : s.feedback.length
                                    ? "feedback"
                                    : undefined,
                              )
                            }
                          >
                            {s.clinical
                              ? "Avaliar triagem"
                              : s.feedback.length
                                ? "Acompanhar sessão"
                                : "Abrir atendimento"}
                          </Button>
                          {!s.clinical && (
                            <Button asChild variant="outline">
                              <Link to={editor(s)}>Montar treino</Link>
                            </Button>
                          )}
                          {s.workout && (
                            <Button asChild variant="outline">
                              <Link
                                to={
                                  "/coach/prescricao?student=" +
                                  s.id +
                                  "&workout=" +
                                  s.workout.id +
                                  "&return=" +
                                  encodeURIComponent(
                                    "/coach?" + params.toString(),
                                  )
                                }
                              >
                                Revisar plano
                              </Link>
                            </Button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <section className="rounded-xl border p-5">
                  <h2 className="font-semibold">Agenda de hoje</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Abra suas aulas para consultar inscritos e registrar
                    presença.
                  </p>
                  <Button asChild variant="outline" className="mt-3">
                    <Link to="/coach?view=agenda&period=hoje">
                      Abrir agenda de hoje
                    </Link>
                  </Button>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </PersonaLayout>
  );
}
