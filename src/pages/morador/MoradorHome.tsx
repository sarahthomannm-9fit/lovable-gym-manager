import { ArrowUpRight } from "lucide-react";
import { PageIntro, SectionHeading } from "@/components/visual/LivingIdentity";
import { FitnessInfrastructure } from "@/components/FitnessInfrastructure";
import {
  WorkoutExecutionCard,
  type ExerciseExecution,
} from "@/components/morador/WorkoutExecutionCard";
import { useResidentDraftGuard } from "@/hooks/useResidentDraftGuard";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PersonaLayout } from "@/layouts/PersonaLayout";
import { ResidentFitnessStatus } from "./ResidentFitnessStatus";
import { SupportTickets } from "@/components/SupportTickets";
import { useAlunoVinculo } from "@/hooks/useAlunoVinculo";
import { supabase } from "@/integrations/supabase/client";
import { localDate, validSessionProgress } from "@/lib/workout";
import { monthBounds, paymentPending, residentDate } from "@/lib/resident";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Progress = Record<string, ExerciseExecution>;
type BlockState = { loading: boolean; error: string };
const initialBlock = { loading: true, error: "" };
function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <h2 className="nl-card-title">{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}
export default function MoradorHome() {
  const {
    aluno,
    loading: linking,
    error: linkError,
    retry,
  } = useAlunoVinculo();
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab") || "hoje";
  const tab = ["hoje", "treino", "mais", "aulas", "suporte"].includes(requested)
    ? requested
    : "hoje";
  const [today, setToday] = useState(localDate());
  useEffect(() => {
    const timer = window.setInterval(() => setToday(localDate()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const [revision, setRevision] = useState(0);
  const [blocks, setBlocks] = useState<Record<string, BlockState>>({});
  const [workout, setWorkout] = useState<any>(null),
    [session, setSession] = useState<any>(null);
  const [progress, setProgress] = useState<Progress>({}),
    [feedback, setFeedback] = useState("");
  const [saved, setSaved] = useState(""),
    [saveError, setSaveError] = useState(""),
    [busy, setBusy] = useState(false);
  const writing = useRef(false),
    live = useRef(true);
  const [classes, setClasses] = useState<any[]>([]),
    [registrations, setRegistrations] = useState<Record<string, string>>({});
  const [payments, setPayments] = useState<any[]>([]),
    [sessions, setSessions] = useState<any[]>([]),
    [presence, setPresence] = useState<number | null>(null),
    [checked, setChecked] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]),
    [reads, setReads] = useState<string[]>([]),
    [notifications, setNotifications] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const snapshot = JSON.stringify({ progress, feedback });
  const dirty = Boolean(
    session?.status === "em_andamento" && saved && saved !== snapshot,
  );
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const [supportDirty, setSupportDirty] = useState(false);
  useResidentDraftGuard(dirty || supportDirty, supportDirty);
  const [recovery, setRecovery] = useState<{
    progress: Progress;
    updated_at: string;
  } | null>(null);
  const recoveryChecked = useRef("");
  useEffect(() => {
    if (!session?.id || !workout?.treino?.id || !aluno?.id) return;
    const key = "nine:execution:" + aluno.id + ":" + workout.treino.id;
    if (recoveryChecked.current !== session.id) {
      recoveryChecked.current = session.id;
      try {
        const value = JSON.parse(sessionStorage.getItem(key) || "null");
        if (
          value?.session_id === session.id &&
          validSessionProgress(value.progress, workout.exercicios || []) &&
          session.status !== "concluido"
        )
          setRecovery(value);
      } catch {
        /* Ignore invalid recovery. */
      }
    }
    if (dirty)
      try {
        sessionStorage.setItem(
          key,
          JSON.stringify({
            session_id: session.id,
            updated_at: session.updated_at,
            progress,
          }),
        );
      } catch {
        /* Current screen remains usable. */
      }
  }, [
    session?.id,
    session?.updated_at,
    session?.status,
    workout?.treino?.id,
    aluno?.id,
    dirty,
    progress,
  ]);

  useEffect(() => {
    if (!aluno?.id || !aluno.organization_id) return;
    let current = true;
    const db = supabase as any,
      today = localDate(),
      bounds = monthBounds(today);
    setBlocks(
      Object.fromEntries(
        [
          "workout",
          "classes",
          "payments",
          "history",
          "presence",
          "organization",
          "announcements",
          "notifications",
        ].map((key) => [key, initialBlock]),
      ),
    );
    const run = async (key: string, load: () => Promise<void>) => {
      try {
        await load();
        if (current)
          setBlocks((old) => ({
            ...old,
            [key]: { loading: false, error: "" },
          }));
      } catch {
        if (current)
          setBlocks((old) => ({
            ...old,
            [key]: {
              loading: false,
              error: "Não foi possível consultar este bloco.",
            },
          }));
      }
    };
    const result = async (query: any) => {
      const response = await query;
      if (response.error) throw response.error;
      return response;
    };
    void Promise.all([
      run("workout", async () => {
        const { data } = await result(
          db.rpc("resident_workout", { p_aluno: aluno.id }),
        );
        if (current) {
          setWorkout(data);
          setSession(data?.session || null);
          setProgress(data?.session?.progress || {});
          setFeedback(data?.session?.feedback || "");
          setSaved(
            JSON.stringify({
              progress: data?.session?.progress || {},
              feedback: data?.session?.feedback || "",
            }),
          );
        }
      }),
      run("classes", async () => {
        const [a, r] = await Promise.all([
          result(
            db
              .from("aulas")
              .select(
                "id,nome,data_aula,horario_inicio,capacidade_maxima,inscritos_atual",
              )
              .eq("organization_id", aluno.organization_id)
              .neq("status", "cancelada")
              .gte("data_aula", today)
              .order("data_aula")
              .order("horario_inicio")
              .limit(20),
          ),
          result(
            db
              .from("aulas_inscritos")
              .select("aula_id,status")
              .eq("aluno_id", aluno.id),
          ),
        ]);
        if (current) {
          setClasses(a.data || []);
          setRegistrations(
            Object.fromEntries(
              (r.data || []).map((row: any) => [row.aula_id, row.status]),
            ),
          );
        }
      }),
      run("payments", async () => {
        const { data } = await result(
          db
            .from("pagamentos")
            .select("id,valor,data_vencimento,status,referencia_mes")
            .eq("aluno_id", aluno.id)
            .order("data_vencimento", { ascending: false })
            .limit(20),
        );
        if (current) setPayments(data || []);
      }),
      run("history", async () => {
        const { data } = await result(
          db
            .from("workout_sessions")
            .select("id,data,status,completion_kind,prescription,progress")
            .eq("aluno_id", aluno.id)
            .eq("status", "concluido")
            .gte("data", bounds.start)
            .lt("data", bounds.next)
            .order("data", { ascending: false }),
        );
        if (current) setSessions(data || []);
      }),
      run("presence", async () => {
        const [a, b] = await Promise.all([
          result(
            db
              .from("checkins")
              .select("id", { count: "exact", head: true })
              .eq("aluno_id", aluno.id)
              .gte("data_checkin", bounds.start)
              .lt("data_checkin", bounds.next),
          ),
          result(
            db
              .from("checkins")
              .select("id")
              .eq("aluno_id", aluno.id)
              .eq("data_checkin", today)
              .maybeSingle(),
          ),
        ]);
        if (current) {
          setPresence(a.count);
          setChecked(Boolean(b.data));
        }
      }),
      run("organization", async () => {
        const { data } = await result(
          db
            .from("organizations")
            .select("nome,metadata,operational_profile")
            .eq("id", aluno.organization_id)
            .single(),
        );
        if (current) setOrganization(data);
      }),
      run("announcements", async () => {
        const [a, r] = await Promise.all([
          result(db.rpc("resident_announcements", { p_aluno_id: aluno.id })),
          result(
            db
              .from("organization_announcement_reads")
              .select("announcement_id")
              .eq("aluno_id", aluno.id)
              .eq("organization_id", aluno.organization_id),
          ),
        ]);
        if (current) {
          setAnnouncements((a.data || []).slice(0, 5));
          setReads((r.data || []).map((row: any) => row.announcement_id));
        }
      }),
      run("notifications", async () => {
        const { data: profile } = await result(
          db
            .from("alunos")
            .select("notifications_enabled")
            .eq("id", aluno.id)
            .single(),
        );
        const { data } =
          profile?.notifications_enabled === false
            ? { data: [] }
            : await result(
                db
                  .from("notificacoes")
                  .select("id,titulo,mensagem,status")
                  .eq("destinatario_id", aluno.id)
                  .order("created_at", { ascending: false })
                  .limit(10),
              );
        if (current) setNotifications(data || []);
      }),
    ]);
    return () => {
      current = false;
    };
  }, [aluno?.id, aluno?.organization_id, revision]);
  const refresh = () => {
    if (
      dirty &&
      !confirm(
        "Atualizar vai descartar as alterações de treino não salvas. Continuar?",
      )
    )
      return;
    setRevision((v) => v + 1);
  };
  const guard = (key: string, children: ReactNode) => {
    const state = blocks[key] || initialBlock;
    return state.loading ? (
      <p role="status">Carregando…</p>
    ) : state.error ? (
      <div role="alert" className="space-y-2">
        <p>{state.error}</p>
        <Button variant="outline" onClick={refresh}>
          Tentar novamente
        </Button>
      </div>
    ) : (
      children
    );
  };
  const act = async (task: () => Promise<void>) => {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    try {
      await task();
    } catch (e) {
      if (live.current)
        toast.error(
          (e as Error).message || "Não foi possível concluir. Tente novamente.",
        );
    } finally {
      writing.current = false;
      if (live.current) setBusy(false);
    }
  };
  const saveSession = (
    action:
      | "start"
      | "save"
      | "pause"
      | "resume"
      | "finish"
      | "finish_partial"
      | "discomfort",
  ) =>
    act(async () => {
      if (!workout?.treino || !workout.exercicios?.length) return;
      if (
        action === "finish" &&
        (session?.status !== "em_andamento" ||
          workout.exercicios.some((ex: any) => !progress[ex.id]?.completed))
      )
        throw new Error(
          "Inicie a sessão e marque os exercícios realizados antes de concluir.",
        );
      if (
        Object.values(progress).some(
          (row) =>
            row.carga !== "" &&
            (!Number.isFinite(Number(row.carga)) || Number(row.carga) < 0),
        )
      )
        throw new Error("Informe cargas válidas, iguais ou maiores que zero.");
      setSaveError("");
      try {
        const { data, error } = await (supabase as any).rpc(
          "save_workout_journey",
          {
            p_treino_id: workout.treino.id,
            p_action: action,
            p_progress: progress,
            p_feedback: feedback,
            p_expected: session?.updated_at || null,
          },
        );
        if (error || !data)
          throw error || new Error("Resposta de sessão indisponível.");
        if (!live.current) return;
        setSession(data);
        setProgress(data.progress || {});
        setFeedback(data.feedback || "");
        setSaved(
          JSON.stringify({
            progress: data.progress || {},
            feedback: data.feedback || "",
          }),
        );
        try {
          sessionStorage.removeItem(
            "nine:execution:" + aluno?.id + ":" + workout.treino.id,
          );
        } catch {
          /* Optional browser recovery. */
        }
        if (action === "finish" || action === "finish_partial") {
          setSessions((old) =>
            old.some((s) => s.id === data.id)
              ? old
              : [
                  {
                    id: data.id,
                    data: data.data,
                    status: "concluido",
                    completion_kind: data.completion_kind,
                    prescription: data.prescription,
                    progress: data.progress,
                  },
                  ...old,
                ],
          );
          toast.success(
            data.completion_kind === "partial"
              ? "Sessão parcial encerrada e registrada."
              : "Treino concluído e registrado.",
          );
        } else toast.success("Sessão salva.");
      } catch (e) {
        if (live.current)
          setSaveError(
            (e as Error).message ||
              "Falha ao salvar. Suas alterações continuam nesta tela.",
          );
      }
    });
  const checkin = () =>
    act(async () => {
      const { error } = await (supabase as any).rpc("record_daily_checkin", {
        p_aluno_id: aluno!.id,
        p_date: localDate(),
      });
      if (error) throw error;
      const { count, error: failure } = await supabase
        .from("checkins")
        .select("id", { count: "exact", head: true })
        .eq("aluno_id", aluno!.id)
        .gte("data_checkin", monthBounds(localDate()).start)
        .lt("data_checkin", monthBounds(localDate()).next);
      if (!live.current) return;
      setChecked(true);
      if (failure) {
        setPresence(null);
        setBlocks((old) => ({
          ...old,
          presence: {
            loading: false,
            error:
              "Presença registrada. Não foi possível atualizar a contagem.",
          },
        }));
      } else setPresence(count);
      toast.success("Presença registrada.");
    });
  const register = (row: any) =>
    act(async () => {
      const enrolled = ["inscrito", "presente"].includes(registrations[row.id]);
      if (enrolled && !confirm("Cancelar inscrição nesta aula?")) return;
      const { data, error } = await (supabase as any).rpc(
        "set_class_registration",
        { p_aula_id: row.id, p_aluno_id: aluno!.id, p_register: !enrolled },
      );
      if (error) throw error;
      if (live.current) setRegistrations((old) => ({ ...old, [row.id]: data }));
      toast.success(
        enrolled ? "Inscrição cancelada." : "Inscrição confirmada.",
      );
    });
  const mark = (id: string, announcement: boolean) =>
    act(async () => {
      const { error } = announcement
        ? await (supabase as any).rpc("mark_announcement_read", {
            p_id: id,
            p_aluno: aluno!.id,
          })
        : await supabase.rpc("read_resident_notification", { p_id: id });
      if (error) throw error;
      if (!live.current) return;
      if (announcement) setReads((old) => [...old, id]);
      else
        setNotifications((old) =>
          old.map((n) => (n.id === id ? { ...n, status: "lida" } : n)),
        );
    });
  const exercises: any[] = workout?.exercicios || [];
  const pending = payments.filter((p) => paymentPending(p.status)).length;
  const phone = String(
    organization?.operational_profile?.support_phone || "",
  ).replace(/[^0-9]/g, "");
  const hasPhone = phone.length >= 10 && phone.length <= 15;
  const openTraining = () => {
    setParams({ tab: "treino" });
    if (exercises.length && (!session || session.status === "pausado"))
      void saveSession(session ? "resume" : "start");
  };
  return (
    <PersonaLayout
      title={
        tab === "treino"
          ? "Meu treino"
          : tab === "mais"
            ? "Meu espaço"
            : tab === "aulas"
              ? "Aulas"
              : tab === "suporte"
                ? "Ajuda"
                : "Meu dia"
      }
      subtitle="Seu treino e sua rotina no condomínio"
    >
      {linking ? (
        <p role="status">Confirmando seu cadastro…</p>
      ) : linkError ? (
        <Panel title="Não foi possível confirmar seu cadastro">
          <p role="alert">{linkError}</p>
          <Button onClick={retry}>Tentar novamente</Button>
          <Button variant="outline" asChild>
            <Link to="/select-context">Selecionar condomínio</Link>
          </Button>
        </Panel>
      ) : !aluno?.organization_id ? (
        <Panel title="Confirme seu condomínio">
          <p>
            Selecione o condomínio correto. Se seu cadastro ainda não estiver
            vinculado, peça apoio à administração.
          </p>
          <Button asChild>
            <Link to="/select-context">Selecionar condomínio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/entrada">Voltar à entrada</Link>
          </Button>
        </Panel>
      ) : (
        <div className="mx-auto max-w-3xl space-y-5">
          <PageIntro
            eyebrow={
              tab === "hoje"
                ? "Olá, " + (aluno.nome?.trim().split(" ")[0] || "bem-vindo")
                : "Seu espaço de movimento"
            }
            title={
              tab === "treino"
                ? "Um movimento de cada vez."
                : tab === "mais"
                  ? "Viver bem, por perto."
                  : tab === "aulas"
                    ? "Encontre seu próximo encontro."
                    : tab === "suporte"
                      ? "Conte com a sua equipe."
                      : "Seu próximo movimento."
            }
            description={
              tab === "treino"
                ? "Sua orientação está aqui. Acompanhe os exercícios e registre a sua evolução."
                : tab === "hoje"
                  ? "Treino, cuidado e bem-estar. Tudo a poucos passos de casa."
                  : tab === "mais"
                    ? "Sua academia, seus encontros e os detalhes que facilitam a rotina."
                    : undefined
            }
            actions={
              tab === "hoje" && workout?.treino && exercises.length > 0 ? (
                <Button onClick={openTraining} disabled={busy}>
                  Abrir meu treino <ArrowUpRight />
                </Button>
              ) : undefined
            }
            compact={tab !== "hoje"}
            tone={tab === "hoje" ? "ink" : "paper"}
          />
          {tab === "treino" && session && exercises.length > 0 && (
            <div className="nl-training-progress">
              <span className="text-xs font-semibold">
                {exercises.filter((e) => progress[e.id]?.completed).length} de{" "}
                {exercises.length} exercícios
              </span>
              <div
                className="nl-training-progress-track"
                role="progressbar"
                aria-label="Exercícios realizados"
                aria-valuenow={
                  exercises.filter((e) => progress[e.id]?.completed).length
                }
                aria-valuemin={0}
                aria-valuemax={exercises.length}
              >
                <div
                  className="nl-training-progress-fill"
                  style={{
                    width:
                      (100 *
                        exercises.filter((e) => progress[e.id]?.completed)
                          .length) /
                        exercises.length +
                      "%",
                  }}
                />
              </div>
            </div>
          )}

          {workout?.data && workout.data !== today && (
            <p role="alert" className="rounded border p-4">
              O dia mudou. Atualize para consultar a sessão de hoje. Salve ou
              confira as alterações antes de sair.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {organization?.nome} · {residentDate(localDate())}
            </p>
            <Button variant="ghost" disabled={busy} onClick={refresh}>
              Atualizar
            </Button>
          </div>
          {tab === "hoje" && (
            <div className="grid items-stretch gap-5 lg:grid-cols-[1.35fr_1fr]">
              <div className="lg:col-span-2">
                <SectionHeading
                  eyebrow="Sua rotina, com intenção"
                  title="Seu próximo passo"
                />
              </div>
              <Panel
                className="nl-resident-feature lg:row-span-2"
                title={
                  workout?.treino
                    ? "Seu treino de hoje"
                    : "Sua jornada de treino"
                }
              >
                {guard(
                  "workout",
                  workout?.treino ? (
                    <>
                      <p>
                        {workout.treino.descricao ||
                          workout.treino.nome ||
                          "Plano personalizado"}
                      </p>
                      <p className="text-muted-foreground">
                        {session?.status === "concluido"
                          ? session.completion_kind === "partial"
                            ? "Sessão parcial encerrada. Seu registro está salvo."
                            : "Treino concluído. Seu resultado está salvo."
                          : !exercises.length
                            ? "Hoje não há exercícios programados neste plano."
                            : session?.status === "pausado"
                              ? "Sua sessão está pausada. Retome quando estiver pronto."
                              : session?.status === "em_andamento"
                                ? "Sua sessão está em andamento."
                                : "Seu plano está disponível para começar."}
                      </p>
                      <Button onClick={openTraining} disabled={busy}>
                        {session?.status === "concluido"
                          ? "Ver sessão registrada"
                          : !exercises.length
                            ? "Consultar meu plano"
                            : session?.status
                              ? "Continuar treino"
                              : "Iniciar treino"}
                      </Button>
                    </>
                  ) : (
                    <ResidentFitnessStatus
                      studentId={aluno.id}
                      organizationId={aluno.organization_id}
                      fallback={
                        workout?.reason || "Consulte a situação do seu plano."
                      }
                      onRefresh={refresh}
                    />
                  ),
                )}
              </Panel>
              <Panel title="Presença no condomínio">
                {guard(
                  "presence",
                  <>
                    <p>
                      Check-in registra sua presença. A conclusão do treino é
                      registrada separadamente.
                    </p>
                    <p className="font-medium">
                      {checked
                        ? "Presença registrada hoje"
                        : `${presence ?? "—"} presenças neste mês`}
                    </p>
                    <Button
                      variant="outline"
                      disabled={busy || checked}
                      onClick={checkin}
                    >
                      {checked
                        ? "Presença confirmada"
                        : "Registrar presença de hoje"}
                    </Button>
                  </>,
                )}
              </Panel>
              <Panel title="Sua prática neste mês">
                {guard(
                  "history",
                  <>
                    <p className="text-3xl font-semibold">{sessions.length}</p>
                    <p>
                      Sessões encerradas desde{" "}
                      {residentDate(monthBounds(localDate()).start)}.
                    </p>
                    <Button asChild variant="outline">
                      <Link to="/morador?tab=mais#historico">
                        Ver histórico
                      </Link>
                    </Button>
                  </>,
                )}
              </Panel>
              <Panel title="Comunicados" className="lg:col-span-2">
                {guard(
                  "announcements",
                  !announcements.length ? (
                    <p>Nenhum comunicado disponível.</p>
                  ) : (
                    announcements.map((row) => (
                      <article key={row.id} className="space-y-2 border-b pb-3">
                        <h3 className="font-medium">{row.titulo}</h3>
                        <p className="whitespace-pre-wrap text-sm">
                          {row.mensagem}
                        </p>
                        {reads.includes(row.id) ? (
                          <p className="text-sm text-muted-foreground">
                            Leitura registrada
                          </p>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => mark(row.id, true)}
                          >
                            Marcar como lido
                          </Button>
                        )}
                      </article>
                    ))
                  ),
                )}
              </Panel>
              <Button
                asChild
                variant="outline"
                className="min-h-12 w-full lg:col-span-2"
              >
                <Link to="/morador/agenda">Ver minha agenda e atividades</Link>
              </Button>
            </div>
          )}
          {tab === "treino" &&
            guard(
              "workout",
              !workout?.treino ? (
                <Panel title="Situação do seu treino">
                  <ResidentFitnessStatus
                    studentId={aluno.id}
                    organizationId={aluno.organization_id}
                    fallback={workout?.reason || "Consulte sua triagem."}
                    onRefresh={refresh}
                  />
                </Panel>
              ) : (
                <>
                  <Panel
                    title={
                      workout.treino.descricao ||
                      workout.treino.nome ||
                      "Seu plano"
                    }
                  >
                    <p>
                      Vigência: {residentDate(workout.treino.data_inicio)} até{" "}
                      {residentDate(workout.treino.data_fim)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Siga as orientações do seu professor. Solicite avaliação
                      para corrigir informações de saúde ou rever o plano.
                    </p>
                  </Panel>
                  {!exercises.length ? (
                    <Panel title="Dia sem exercícios programados">
                      <p>Consulte a agenda ou peça orientação à equipe.</p>
                    </Panel>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-3">
                        {!session && (
                          <Button
                            disabled={busy}
                            onClick={() => saveSession("start")}
                          >
                            Iniciar sessão
                          </Button>
                        )}
                        {session?.status === "pausado" && (
                          <Button
                            disabled={busy}
                            onClick={() => saveSession("resume")}
                          >
                            Retomar sessão
                          </Button>
                        )}
                        <p role="status" className="text-sm">
                          {dirty
                            ? "Alterações ainda não salvas"
                            : session
                              ? "Progresso salvo no servidor"
                              : "Inicie a sessão para registrar os exercícios"}
                        </p>
                      </div>
                      {recovery && (
                        <div
                          role="status"
                          className="space-y-3 rounded border p-4"
                        >
                          <p>
                            Há um registro local não confirmado nesta aba.{" "}
                            {recovery.updated_at !== session?.updated_at
                              ? "A sessão mudou no servidor; confira o registro local antes de reconciliar."
                              : "Você pode recuperar o progresso que ainda não havia sido salvo."}
                          </p>
                          <details>
                            <summary>Conferir registro local</summary>
                            {(workout.exercicios || []).map((e: any) => {
                              const r = recovery.progress[e.id];
                              if (!r) return null;
                              const actual =
                                e.alternativas?.find(
                                  (a: any) =>
                                    a.exercicio_id === r.alternative_id,
                                ) || e;
                              return (
                                <p key={e.id} className="py-2 text-sm">
                                  {actual.nome} ·{" "}
                                  {r.completed ? "Realizado" : "Pendente"} ·
                                  carga {r.carga || "não registrada"} · séries{" "}
                                  {r.series || "não registradas"} · repetições{" "}
                                  {r.repeticoes || "não registradas"}
                                </p>
                              );
                            })}
                          </details>
                          <Button
                            variant="outline"
                            disabled={
                              recovery.updated_at !== session?.updated_at
                            }
                            onClick={() => {
                              setProgress(recovery.progress);
                              setRecovery(null);
                            }}
                          >
                            Recuperar progresso
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setRecovery(null);
                              try {
                                sessionStorage.removeItem(
                                  "nine:execution:" +
                                    aluno?.id +
                                    ":" +
                                    workout.treino.id,
                                );
                              } catch {
                                /* Optional recovery. */
                              }
                            }}
                          >
                            Manter registro do servidor
                          </Button>
                        </div>
                      )}
                      {session?.attention === "discomfort" && (
                        <p role="status" className="rounded border p-3 text-sm">
                          Relato de desconforto registrado para acompanhamento
                          profissional. Usar alternativa por aparelho ocupado é
                          uma situação diferente.
                        </p>
                      )}
                      {workout?.pinned && (
                        <p className="text-xs text-muted-foreground">
                          Esta sessão preserva a prescrição do início. Revisões
                          do coach serão consultadas nas próximas sessões.
                        </p>
                      )}
                      {exercises.map((ex, index) => (
                        <WorkoutExecutionCard
                          key={ex.id}
                          exercise={ex}
                          facilities={workout.infrastructure}
                          index={index}
                          value={progress[ex.id]}
                          disabled={busy || session?.status !== "em_andamento"}
                          onChange={(row) =>
                            setProgress((old) => ({ ...old, [ex.id]: row }))
                          }
                        />
                      ))}
                      <Panel title="Registro da sessão">
                        <label className="block text-sm">
                          Como foi o treino? Observação para a equipe (opcional)
                          <Textarea
                            className="mt-2"
                            maxLength={2000}
                            disabled={
                              busy || session?.status !== "em_andamento"
                            }
                            value={feedback}
                            onChange={(event) =>
                              setFeedback(event.target.value)
                            }
                          />
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Este registro não substitui o atendimento
                          profissional. Para orientação e reavaliação, fale com
                          a equipe.
                        </p>
                        {saveError && (
                          <p role="alert" className="text-destructive">
                            {saveError} Suas alterações continuam nesta tela.
                          </p>
                        )}
                        {session?.status === "em_andamento" && (
                          <div className="flex flex-wrap gap-3">
                            <Button
                              disabled={busy}
                              variant="outline"
                              onClick={() => saveSession("save")}
                            >
                              Salvar progresso
                            </Button>
                            <Button
                              disabled={busy}
                              variant="outline"
                              onClick={() => saveSession("pause")}
                            >
                              Salvar e pausar
                            </Button>
                            <Button
                              disabled={busy}
                              onClick={() => {
                                const partial = exercises.some(
                                  (ex) => !progress[ex.id]?.completed,
                                );
                                if (
                                  confirm(
                                    partial
                                      ? "Há exercícios pendentes. Encerrar como sessão parcial?"
                                      : "Confirmar conclusão da sessão?",
                                  )
                                )
                                  void saveSession(
                                    partial ? "finish_partial" : "finish",
                                  );
                              }}
                            >
                              Encerrar sessão
                            </Button>
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => {
                                if (feedback.trim().length < 3)
                                  return toast.error(
                                    "Descreva o desconforto no campo acima para encaminhar ao profissional.",
                                  );
                                if (
                                  confirm(
                                    "Interromper e registrar o relato para o coach? Este canal não é atendimento imediato.",
                                  )
                                )
                                  void saveSession("discomfort");
                              }}
                            >
                              Interromper por desconforto
                            </Button>
                          </div>
                        )}
                        {session?.status === "concluido" && (
                          <p role="status" className="font-medium">
                            {session.completion_kind === "partial"
                              ? "Sessão parcial encerrada. Exercícios pendentes preservados."
                              : "Treino concluído. Resultado salvo."}
                          </p>
                        )}
                      </Panel>
                    </>
                  )}
                </>
              ),
            )}
          {tab === "aulas" && (
            <Panel title="Aulas disponíveis">
              {guard(
                "classes",
                classes.length ? (
                  classes.map((row) => (
                    <article key={row.id} className="space-y-2 border-b pb-4">
                      <h3 className="font-medium">{row.nome}</h3>
                      <p>
                        {residentDate(row.data_aula)} ·{" "}
                        {row.horario_inicio?.slice(0, 5)}
                      </p>
                      <p className="text-sm">
                        {registrations[row.id] === "presente"
                          ? "Presença registrada"
                          : registrations[row.id] === "inscrito"
                            ? "Inscrição confirmada"
                            : "Consulte a disponibilidade ao se inscrever"}
                      </p>
                      <Button
                        disabled={busy || registrations[row.id] === "presente"}
                        onClick={() => register(row)}
                      >
                        {registrations[row.id] === "inscrito"
                          ? "Cancelar inscrição"
                          : "Inscrever-me"}
                      </Button>
                    </article>
                  ))
                ) : (
                  <p>Nenhuma aula disponível.</p>
                ),
              )}
            </Panel>
          )}
          {tab === "suporte" && (
            <>
              <Panel title="Falar com a equipe do condomínio">
                {guard(
                  "organization",
                  <>
                    <p>
                      Canal de atendimento configurado pela administração para
                      dúvidas, ajustes e encaminhamento ao professor.
                    </p>
                    {hasPhone ? (
                      <Button asChild>
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={"https://wa.me/" + phone}
                        >
                          Abrir atendimento no WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <p>
                        WhatsApp ainda não configurado. Você pode abrir um
                        chamado abaixo.
                      </p>
                    )}
                  </>,
                )}
              </Panel>
              <SupportTickets
                key={aluno.id + ":" + (params.get("destino") || "condominio")}
                onDirtyChange={setSupportDirty}
                initialCategory={params.get("destino") || "condominio"}
                orgId={aluno.organization_id}
                alunoId={aluno.id}
              />
            </>
          )}
          {tab === "mais" && (
            <>
              <Panel title="Seu espaço">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Meu perfil", "/morador/perfil"],
                    ["Aulas", "/morador?tab=aulas"],
                    ["Eventos", "/morador/eventos"],
                    ["Reservas e serviços", "/morador/operacao"],
                    ["Ajuda e reavaliação", "/morador?tab=suporte"],
                    ...(organization?.metadata?.features?.staff === true
                      ? [["Agendar profissional", "/morador/staff"]]
                      : []),
                  ].map(([label, to]) => (
                    <Button
                      key={to}
                      variant="outline"
                      asChild
                      className="min-h-12 justify-start"
                    >
                      <Link to={to}>{label}</Link>
                    </Button>
                  ))}
                </div>
                {guard(
                  "organization",
                  <p className="text-sm text-muted-foreground">
                    Serviços conforme disponibilidade do seu condomínio.
                  </p>,
                )}
              </Panel>
              <Panel title="Pagamentos">
                {guard(
                  "payments",
                  <>
                    <p>
                      {pending
                        ? `${pending} cobrança(s) pendente(s) entre as ${payments.length} mais recentes`
                        : "Nenhuma pendência entre as cobranças consultadas."}
                    </p>
                    {!payments.length ? (
                      <p>Sem cobranças registradas.</p>
                    ) : (
                      payments.map((p) => (
                        <article
                          key={p.id}
                          className="flex flex-wrap justify-between gap-2 border-b py-3"
                        >
                          <div>
                            <p>
                              {Number(p.valor).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                            <p className="text-sm">
                              Vencimento: {residentDate(p.data_vencimento)}
                              {p.referencia_mes
                                ? ` · Referência: ${p.referencia_mes}`
                                : ""}
                            </p>
                          </div>
                          <span>{p.status}</span>
                        </article>
                      ))
                    )}
                  </>,
                )}
              </Panel>
              <section id="historico" className="scroll-mt-40">
                <Panel title="Sessões encerradas neste mês">
                  {guard(
                    "history",
                    sessions.length ? (
                      <ul className="space-y-2">
                        {sessions.map((s) => (
                          <li key={s.id}>
                            {s.completion_kind === "partial"
                              ? "Sessão parcial"
                              : "Treino concluído"}{" "}
                            em {residentDate(s.data)}
                            <details className="rounded border p-3">
                              <summary className="min-h-11 cursor-pointer py-2">
                                Ver execução registrada
                              </summary>
                              {(s.prescription?.exercicios || []).map(
                                (e: any) => {
                                  const r = s.progress?.[e.id];
                                  const actual =
                                    e.alternativas?.find(
                                      (a: any) =>
                                        a.exercicio_id === r?.alternative_id,
                                    ) || e;
                                  return (
                                    <p key={e.id} className="py-2 text-sm">
                                      {actual.nome}
                                      {r?.alternative_id
                                        ? " (alternativa)"
                                        : ""}{" "}
                                      ·{" "}
                                      {r?.completed ? "Realizado" : "Pendente"}{" "}
                                      · carga {r?.carga || "não registrada"} ·
                                      séries {r?.series || "não registradas"} ·
                                      repetições{" "}
                                      {r?.repeticoes || "não registradas"}
                                    </p>
                                  );
                                },
                              )}
                            </details>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        Nenhuma sessão encerrada neste mês. Presenças são
                        contadas separadamente.
                      </p>
                    ),
                  )}
                </Panel>
              </section>
              <FitnessInfrastructure
                key={aluno.organization_id}
                orgId={aluno.organization_id}
              />
              <Panel title="Avisos pessoais">
                {guard(
                  "notifications",
                  notifications.length ? (
                    notifications.map((n) => (
                      <article key={n.id} className="space-y-2 border-b pb-3">
                        <h3 className="font-medium">{n.titulo}</h3>
                        <p className="text-sm">{n.mensagem}</p>
                        {n.status === "lida" ? (
                          <p className="text-sm">Lido</p>
                        ) : (
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => mark(n.id, false)}
                          >
                            Marcar como lido
                          </Button>
                        )}
                      </article>
                    ))
                  ) : (
                    <p>Nenhum aviso pessoal disponível.</p>
                  ),
                )}
              </Panel>
            </>
          )}
        </div>
      )}
    </PersonaLayout>
  );
}
