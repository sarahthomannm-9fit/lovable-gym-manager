import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useResidentDraftGuard } from "@/hooks/useResidentDraftGuard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  WEEKDAYS,
  localDate,
  validateWorkout,
  publicationPayload,
  type WorkoutDraft,
  type ExerciseDraft,
} from "@/lib/workout";
import {
  exerciseAvailability,
  validExerciseDrafts,
  weeksDiffer,
} from "@/lib/coach";
import { residentDate } from "@/lib/resident";
import { CoachAlternatives } from "@/components/coach/CoachAlternatives";
import { HealthCapture } from "@/components/coach/HealthCapture";
type LibraryExercise = {
  id: string;
  nome: string;
  grupo_muscular: string | null;
  equipamento: string | null;
  ativo: boolean;
  restricoes_incompativeis: string[];
};
interface Props {
  alunos: { id: string; nome: string }[];
  organizationId?: string | null;
  onCriado: () => void;
  trigger?: ReactNode;
  initialAlunoId?: string;
  initialWorkoutId?: string;
  initialPlanId?: string;
  initialProtocolId?: string;
  queueId?: string;
  embedded?: boolean;
  onClose?: () => void;
  protocolAdjustments?: Record<string, any>;
  protocolDraft?: Pick<WorkoutDraft, "nome" | "objetivo" | "nivel"> & {
    exercicios?: Omit<ExerciseDraft, "key">[];
  };
}
const newDraft = (student = ""): WorkoutDraft => ({
  requestId: crypto.randomUUID(),
  aluno_id: student,
  nome: "",
  objetivo: "",
  nivel: "iniciante",
  data_inicio: localDate(),
  semanas: 4,
  exercicios: [],
});
const selectClass =
  "min-h-11 w-full rounded-md border bg-background p-2 text-sm";
function EditorNavigationGuard({ dirty }: { dirty: boolean }) {
  useResidentDraftGuard(dirty);
  return null;
}
export function CriarTreinoDialog(props: Props) {
  const {
    alunos,
    organizationId,
    onCriado,
    trigger,
    initialAlunoId,
    initialWorkoutId,
    initialPlanId,
    initialProtocolId,
    queueId,
    embedded,
    onClose,
    protocolDraft,
    protocolAdjustments,
  } = props;
  const { user } = useAuth();
  const key = `9fit:workout-draft:${user?.id}:${organizationId}:${initialAlunoId || "new"}:${initialWorkoutId || initialPlanId || queueId || initialProtocolId || "new"}`;
  const [open, setOpen] = useState(!!embedded),
    [step, setStep] = useState(0),
    [day, setDay] = useState(1);
  const [draft, setDraft] = useState<WorkoutDraft>(() =>
    newDraft(initialAlunoId),
  );
  const [library, setLibrary] = useState<LibraryExercise[]>([]),
    [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(true),
    [contextLoading, setContextLoading] = useState(false),
    [loadError, setLoadError] = useState(""),
    [error, setError] = useState("");
  const [planBlocked, setPlanBlocked] = useState(""),
    [storage, setStorage] = useState("salvando"),
    [revision, setRevision] = useState(0);
  const [search, setSearch] = useState(""),
    [group, setGroup] = useState(""),
    [equipmentFilter, setEquipmentFilter] = useState("");
  const [pendingPublication, setPendingPublication] = useState(false);
  const [reason, setReason] = useState(""),
    [saving, setSaving] = useState(false),
    [substitutions, setSubstitutions] = useState<Record<string, any[]>>({});
  const locked = useRef(false),
    confirmed = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => {
    if (!open || !organizationId) return;
    let live = true;
    setLoading(true);
    setLoadError("");
    setPlanBlocked("");
    setContext(null);
    setError("");
    confirmed.current = false;
    void (async () => {
      try {
        const db = supabase as any;
        const { data: lib, error: failure } = await db
          .from("exercicios_biblioteca")
          .select(
            "id,nome,grupo_muscular,equipamento,ativo,restricoes_incompativeis",
          )
          .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
          .order("nome");
        if (failure) throw failure;
        let next: WorkoutDraft = {
          ...newDraft(initialAlunoId),
          ...protocolDraft,
          exercicios:
            protocolDraft?.exercicios?.map((row) => ({
              ...row,
              key: crypto.randomUUID(),
            })) || [],
        };
        let restored = false;
        try {
          const value = JSON.parse(localStorage.getItem(key) || "null");
          if (
            value &&
            typeof value.requestId === "string" &&
            /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(
              value.requestId,
            ) &&
            typeof value.nome === "string" &&
            typeof value.objetivo === "string" &&
            typeof value.nivel === "string" &&
            typeof value.data_inicio === "string" &&
            Number.isInteger(value.semanas) &&
            validExerciseDrafts(value.exercicios) &&
            alunos.some((a) => a.id === value.aluno_id) &&
            (!initialAlunoId || value.aluno_id === initialAlunoId)
          ) {
            next = value;
            restored = true;
          }
        } catch {
          /* Invalid storage is not a prescription. */
        }
        if (initialWorkoutId || initialPlanId) {
          let plan = initialPlanId;
          if (initialWorkoutId) {
            const { data, error } = await db
              .from("treinos")
              .select("aluno_id,plano_treino_id")
              .eq("id", initialWorkoutId)
              .eq("organization_id", organizationId)
              .single();
            if (
              error ||
              !data?.plano_treino_id ||
              data.aluno_id !== initialAlunoId
            )
              throw (
                error ||
                new Error("Plano de origem indisponível para este morador.")
              );
            plan = data.plano_treino_id;
          }
          const [p, r] = await Promise.all([
            db
              .from("planos_treino")
              .select("nome,objetivo,nivel,semanas")
              .eq("id", plan)
              .eq("organization_id", organizationId)
              .single(),
            db
              .from("plano_exercicios")
              .select("*")
              .eq("plano_treino_id", plan)
              .order("dia_semana")
              .order("ordem"),
          ]);
          if (p.error || r.error) throw p.error || r.error;
          const weeks = new Set((r.data || []).map((row: any) => row.semana));
          if (weeksDiffer(r.data || []) || weeks.size !== p.data.semanas) {
            if (live)
              setPlanBlocked(
                "Este plano possui semanas diferentes ou incompletas. A revisão simplificada não pode substituir sua programação. O plano original foi preservado; não é possível publicar esta conversão.",
              );
          }
          if (!restored)
            next = {
              ...next,
              nome: p.data.nome + (initialWorkoutId ? " — revisão" : ""),
              objetivo: p.data.objetivo || "",
              nivel: p.data.nivel || "iniciante",
              semanas: p.data.semanas,
              exercicios: (r.data || [])
                .filter((row: any) => row.semana === 1)
                .map((row: any) => ({
                  key: crypto.randomUUID(),
                  exercicio_id: row.exercicio_id,
                  nome:
                    lib.find((e: any) => e.id === row.exercicio_id)?.nome ||
                    "Exercício indisponível",
                  dia_semana: row.dia_semana,
                  series: row.series,
                  repeticoes: row.repeticoes,
                  carga_kg: row.carga_kg == null ? "" : String(row.carga_kg),
                  descanso_seg: row.descanso_seg,
                  observacoes: row.observacoes || "",
                  alternativas: (row.alternativas || []).map((a: any) => ({
                    ...a,
                    nome:
                      lib.find((e: any) => e.id === a.exercicio_id)?.nome ||
                      "Exercício indisponível",
                    carga_kg: a.carga_kg == null ? "" : String(a.carga_kg),
                    observacoes: a.observacoes || "",
                  })),
                })),
            };
        } else if (initialProtocolId && !restored) {
          const { data, error } = await db
            .from("workout_protocol_templates")
            .select("nome,objetivo,nivel,estrutura")
            .eq("id", initialProtocolId)
            .eq("ativo", true)
            .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
            .single();
          if (error) throw error;
          const rows = data.estrutura?.exercicios;
          if (!Array.isArray(rows) || rows.length < 3)
            throw new Error(
              "Protocolo sem exercícios suficientes. Abra a montagem manual para este morador.",
            );
          next = {
            ...next,
            nome: data.nome,
            objetivo: data.objetivo || "",
            nivel: data.nivel || "iniciante",
            exercicios: rows.map((row: any) => ({
              key: crypto.randomUUID(),
              exercicio_id: row.exercicio_id,
              nome:
                lib.find((e: any) => e.id === row.exercicio_id)?.nome ||
                "Exercício indisponível",
              dia_semana: Number(row.dia_semana),
              series: Number(
                protocolAdjustments?.[row.exercicio_id]?.[row.dia_semana]
                  ?.series ?? row.series,
              ),
              repeticoes: String(row.repeticoes || ""),
              carga_kg: "",
              descanso_seg: Number(
                protocolAdjustments?.[row.exercicio_id]?.[row.dia_semana]
                  ?.descanso_seg ?? row.descanso_seg,
              ),
              observacoes: "",
            })),
          };
        }
        if (live) {
          setLibrary(lib || []);
          setDraft(next);
          setStep(0);
          setSubstitutions({});
        }
      } catch (e) {
        if (live)
          setLoadError(
            (e as Error).message ||
              "Não foi possível carregar a origem e a biblioteca.",
          );
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [
    open,
    organizationId,
    initialAlunoId,
    initialWorkoutId,
    initialPlanId,
    initialProtocolId,
    queueId,
    revision,
  ]);
  useEffect(() => {
    if (!open || !draft.aluno_id || !organizationId) return;
    let live = true;
    setContext(null);
    setContextLoading(true);
    void (async () => {
      try {
        const { data, error } = await (supabase as any).rpc(
          "coach_student_case",
          { p_student: draft.aluno_id },
        );
        if (error || data?.student?.organization_id !== organizationId)
          throw error || new Error();
        if (live) setContext(data);
      } catch {
        if (live)
          setError(
            "Não foi possível confirmar a segurança e o inventário. Atualize antes de publicar.",
          );
      } finally {
        if (live) setContextLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [open, draft.aluno_id, organizationId, revision]);
  useEffect(() => {
    if (!open || loading || loadError) return;
    setStorage("salvando");
    try {
      localStorage.setItem(key, JSON.stringify(draft));
      setStorage("salvo");
    } catch {
      setStorage("falha");
    }
  }, [draft, open, loading, loadError, key]);
  const patch = (value: Partial<WorkoutDraft>) => {
    setDraft((old) => ({ ...old, ...value }));
    setError("");
  };
  const edit = (id: string, value: Partial<ExerciseDraft>) =>
    patch({
      exercicios: draft.exercicios.map((row) =>
        row.key === id ? { ...row, ...value } : row,
      ),
    });
  const restrictions = [
    ...(context?.safety?.restricoes || []),
    ...(context?.safety?.lesoes_atuais || []),
  ];
  const unavailable = (exercise: any) =>
    !context
      ? "Aguardando confirmação do inventário e da segurança"
      : exerciseAvailability(exercise, context.equipment || [], restrictions);
  const invalidSelected = draft.exercicios
    .flatMap((row) => [row, ...(row.alternativas || [])])
    .find((row) => {
      const ex = library.find((e) => e.id === row.exercicio_id);
      return !ex || unavailable(ex);
    });
  const eligible = Boolean(
    context?.can_prescribe &&
      (context.can_publish_direct ||
        (queueId &&
          context.queue?.id === queueId &&
          context.queue?.status === "pendente")) &&
      !planBlocked &&
      !invalidSelected,
  );
  const validate = () =>
    validateWorkout(draft) ||
    (!eligible
      ? "Confirme a liberação, o inventário e todos os exercícios antes de publicar."
      : initialWorkoutId && reason.trim().length < 3
        ? "Informe o motivo da revisão."
        : "");
  const close = () => {
    if (locked.current) return;
    setOpen(false);
    onClose?.();
  };
  const publish = async () => {
    if (locked.current) return;
    const failure = validate();
    if (failure) return setError(failure);
    locked.current = true;
    setSaving(true);
    setError("");
    setPendingPublication(true);
    const payload = publicationPayload(draft);
    try {
      const { data, error } = await (supabase as any).rpc(
        "coach_publish_workout",
        {
          p_request: draft.requestId,
          p_payload: payload,
          p_original: initialWorkoutId || null,
          p_reason: initialWorkoutId ? reason.trim() : null,
          p_queue: queueId || null,
          p_capture:
            !queueId &&
            context.capture?.tipo !== "par_q_portaria" &&
            !context.capture?.respostas?.triagem_portaria
              ? context.capture?.id || null
              : null,
        },
      );
      if (error || !data)
        throw error || new Error("Confirmação de publicação indisponível.");
      setPendingPublication(false);
      confirmed.current = true;
      try {
        localStorage.removeItem(key);
      } catch {
        /* Server publication succeeded. */
      }
      toast.success(
        "Publicação confirmada para " +
          (alunos.find((a) => a.id === draft.aluno_id)?.nome || "o morador") +
          ".",
      );
      setOpen(false);
      try {
        await onCriado();
      } catch {
        toast.info(
          "O treino foi publicado. Atualize a lista para consultar o resultado.",
        );
      }
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code && /^[0-9A-Z]{5}$/.test(code)) setPendingPublication(false);
      setError(
        ((e as Error).message || "Resultado de publicação não confirmado.") +
          " O rascunho foi preservado. Repetir usa o mesmo identificador.",
      );
    } finally {
      locked.current = false;
      setSaving(false);
    }
  };
  const move = (id: string, offset: number) => {
    const rows = [...draft.exercicios],
      index = rows.findIndex((row) => row.key === id);
    let target = index + offset;
    while (
      target >= 0 &&
      target < rows.length &&
      rows[target].dia_semana !== rows[index].dia_semana
    )
      target += offset;
    if (target < 0 || target >= rows.length) return;
    [rows[index], rows[target]] = [rows[target], rows[index]];
    patch({ exercicios: rows });
  };
  const matches = library.filter(
    (e) =>
      (!group || e.grupo_muscular === group) &&
      (!equipmentFilter || e.equipamento === equipmentFilter) &&
      `${e.nome} ${e.grupo_muscular || ""} ${e.equipamento || ""}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const body = (
    <div className="space-y-5">
      {open && (
        <EditorNavigationGuard
          dirty={Boolean(
            draft.exercicios.length &&
              storage !== "salvo" &&
              !confirmed.current,
          )}
        />
      )}
      <header className="sticky top-0 z-10 space-y-2 rounded-xl border bg-background p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {initialWorkoutId
            ? "Revisão de plano"
            : initialProtocolId || protocolDraft
              ? "Protocolo sugerido — revisão obrigatória"
              : "Montagem manual"}
        </p>
        <h1 ref={heading} tabIndex={-1} className="text-2xl font-semibold">
          {alunos.find((a) => a.id === draft.aluno_id)?.nome ||
            "Escolha o morador"}{" "}
          · {step === 0 ? "Contexto" : step === 1 ? "Montagem" : "Conferência"}
        </h1>
        <p className="text-sm">
          {contextLoading
            ? "Confirmando avaliação…"
            : context?.can_prescribe
              ? "Avaliação permite preparar prescrição"
              : "Avaliação ou liberação necessária"}{" "}
          ·{" "}
          {storage === "salvo"
            ? "Rascunho salvo neste dispositivo"
            : storage === "falha"
              ? "Falha ao salvar no dispositivo"
              : "Salvando rascunho…"}
        </p>
        <nav aria-label="Etapas da prescrição" className="flex flex-wrap gap-2">
          {["1. Contexto", "2. Montagem", "3. Conferência"].map((label, i) => (
            <Button
              key={label}
              size="sm"
              variant={step === i ? "default" : "outline"}
              disabled={saving || pendingPublication || loading || !!loadError}
              onClick={() => {
                if (i === 2) {
                  const error = validate();
                  if (error) return setError(error);
                }
                setStep(i);
              }}
            >
              {label}
            </Button>
          ))}
        </nav>
      </header>
      {loading ? (
        <p role="status">Carregando biblioteca e plano de origem…</p>
      ) : loadError ? (
        <div role="alert" className="space-y-2">
          <p>{loadError}</p>
          {embedded && initialAlunoId && (
            <Button variant="outline" asChild>
              <Link
                to={
                  "/coach/prescricao?student=" +
                  initialAlunoId +
                  (queueId ? "&queue=" + queueId : "") +
                  "&manual=1"
                }
              >
                Abrir montagem manual
              </Link>
            </Button>
          )}
          <Button onClick={() => setRevision((v) => v + 1)}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          {pendingPublication && (
            <p role="status" className="rounded border p-4 text-sm">
              Resultado ainda não confirmado. Os parâmetros ficam preservados
              para consultar e repetir o mesmo envio.
            </p>
          )}
          {(error || planBlocked) && (
            <p
              role="alert"
              className="rounded-lg border border-destructive p-4 text-sm"
            >
              {error || planBlocked}
            </p>
          )}
          <fieldset
            disabled={saving || pendingPublication}
            className="min-w-0 space-y-5"
          >
            {step === 0 && (
              <div className="space-y-4 rounded-xl border p-5">
                <label className="block text-sm">
                  Morador
                  <select
                    className={selectClass}
                    disabled={!!initialAlunoId}
                    value={draft.aluno_id}
                    onChange={(e) => {
                      if (
                        draft.exercicios.length &&
                        !confirm(
                          "Trocar o morador e limpar os exercícios deste rascunho?",
                        )
                      )
                        return;
                      patch({ ...newDraft(e.target.value) });
                    }}
                  >
                    <option value="">Escolha o morador</option>
                    {alunos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Nome do treino", "nome"],
                    ["Objetivo", "objetivo"],
                  ].map(([label, key]) => (
                    <label key={key} className="text-sm">
                      {label}
                      <Input
                        value={(draft as any)[key]}
                        maxLength={120}
                        onChange={(e) => patch({ [key]: e.target.value })}
                      />
                    </label>
                  ))}
                  <label className="text-sm">
                    Início
                    <Input
                      type="date"
                      value={draft.data_inicio}
                      onChange={(e) => patch({ data_inicio: e.target.value })}
                    />
                  </label>
                  <label className="text-sm">
                    Validade em semanas
                    <Input
                      type="number"
                      min={4}
                      max={12}
                      value={draft.semanas}
                      onChange={(e) =>
                        patch({ semanas: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label className="text-sm">
                    Experiência
                    <select
                      className={selectClass}
                      value={draft.nivel}
                      onChange={(e) => patch({ nivel: e.target.value })}
                    >
                      {["iniciante", "intermediário", "avançado"].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Esta programação se repete a cada semana durante a validade.
                  Reuso de protocolo não importa cargas nem observações
                  pessoais.
                </p>
                {initialWorkoutId && (
                  <label className="block text-sm">
                    Motivo da revisão
                    <Textarea
                      maxLength={2000}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                )}
                <details>
                  <summary className="min-h-11 cursor-pointer py-3">
                    Avaliação e infraestrutura
                  </summary>
                  {context ? (
                    <>
                      <HealthCapture
                        capture={context.capture}
                        safety={context.safety}
                      />
                      <p className="mt-4 text-sm">
                        Equipamentos aprovados:{" "}
                        {context.equipment?.join(", ") || "Nenhum cadastrado"}
                      </p>
                    </>
                  ) : (
                    <p>Não foi possível consultar o contexto.</p>
                  )}
                </details>
                {!context?.can_prescribe && draft.aluno_id && (
                  <Button asChild variant="outline">
                    <Link
                      to={
                        "/coach?student=" +
                        draft.aluno_id +
                        "&section=avaliacao"
                      }
                    >
                      Abrir avaliação do morador
                    </Link>
                  </Button>
                )}
              </div>
            )}
            {step === 1 && (
              <div className="grid items-start gap-5 lg:grid-cols-[200px_1fr]">
                <nav
                  className="flex flex-wrap gap-2 lg:sticky lg:top-44 lg:flex-col"
                  aria-label="Dias do treino"
                >
                  {WEEKDAYS.map((name, i) => (
                    <Button
                      key={name}
                      variant={day === i + 1 ? "default" : "outline"}
                      onClick={() => setDay(i + 1)}
                    >
                      {name} ·{" "}
                      {
                        draft.exercicios.filter((e) => e.dia_semana === i + 1)
                          .length
                      }
                    </Button>
                  ))}
                </nav>
                <div className="space-y-4">
                  <details className="rounded-xl border p-4" open>
                    <summary className="cursor-pointer font-semibold">
                      Adicionar exercício à {WEEKDAYS[day - 1].toLowerCase()}
                    </summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Input
                        className="sm:col-span-2"
                        aria-label="Buscar exercício"
                        placeholder="Buscar exercício"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <select
                        className={selectClass}
                        aria-label="Grupo muscular"
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                      >
                        <option value="">Todos os grupos</option>
                        {[
                          ...new Set(
                            library
                              .map((e) => e.grupo_muscular)
                              .filter(Boolean),
                          ),
                        ].map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                      <select
                        className={selectClass}
                        aria-label="Equipamento"
                        value={equipmentFilter}
                        onChange={(e) => setEquipmentFilter(e.target.value)}
                      >
                        <option value="">Todos os equipamentos</option>
                        {[
                          ...new Set(
                            library.map((e) => e.equipamento).filter(Boolean),
                          ),
                        ].map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                      {matches.map((ex) => {
                        const why = unavailable(ex);
                        return (
                          <div
                            key={ex.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                          >
                            <div>
                              <p className="font-medium">{ex.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {ex.grupo_muscular || "Grupo não informado"} ·{" "}
                                {ex.equipamento || "Sem equipamento"}
                              </p>
                              {why && (
                                <p className="text-xs text-amber-700">{why}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!!why}
                              onClick={() =>
                                patch({
                                  exercicios: [
                                    ...draft.exercicios,
                                    {
                                      key: crypto.randomUUID(),
                                      exercicio_id: ex.id,
                                      nome: ex.nome,
                                      dia_semana: day,
                                      series: 3,
                                      repeticoes: "12",
                                      carga_kg: "",
                                      descanso_seg: 60,
                                      observacoes: "",
                                    },
                                  ],
                                })
                              }
                            >
                              Adicionar
                            </Button>
                          </div>
                        );
                      })}
                      {!matches.length && (
                        <p>Nenhum resultado para estes filtros.</p>
                      )}
                    </div>
                  </details>
                  {draft.exercicios
                    .filter((e) => e.dia_semana === day)
                    .map((ex) => {
                      const source = library.find(
                        (e) => e.id === ex.exercicio_id,
                      );
                      const why = source
                        ? unavailable(source)
                        : "Exercício indisponível";
                      return (
                        <section
                          key={ex.key}
                          className="space-y-4 rounded-xl border p-4"
                        >
                          <h2 className="text-lg font-semibold">{ex.nome}</h2>
                          {why && (
                            <p
                              role="alert"
                              className="text-sm text-destructive"
                            >
                              {why}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {[
                              ["Subir", -1],
                              ["Descer", 1],
                            ].map(([label, offset]) => (
                              <Button
                                key={label}
                                size="sm"
                                variant="outline"
                                aria-label={label + " " + ex.nome}
                                onClick={() => move(ex.key, Number(offset))}
                              >
                                {label}
                              </Button>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                patch({
                                  exercicios: [
                                    ...draft.exercicios,
                                    { ...ex, key: crypto.randomUUID() },
                                  ],
                                })
                              }
                            >
                              Duplicar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                patch({
                                  exercicios: draft.exercicios.filter(
                                    (e) => e.key !== ex.key,
                                  ),
                                })
                              }
                            >
                              Remover
                            </Button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="text-sm">
                              Séries
                              <Input
                                type="number"
                                min={1}
                                max={30}
                                value={ex.series}
                                onChange={(e) =>
                                  edit(ex.key, {
                                    series: Number(e.target.value),
                                  })
                                }
                              />
                            </label>
                            <label className="text-sm">
                              Repetições
                              <Input
                                value={ex.repeticoes}
                                maxLength={100}
                                onChange={(e) =>
                                  edit(ex.key, { repeticoes: e.target.value })
                                }
                              />
                            </label>
                            <label className="text-sm">
                              Carga prescrita (kg, opcional)
                              <Input
                                type="number"
                                min={0}
                                step="0.5"
                                value={ex.carga_kg}
                                onChange={(e) =>
                                  edit(ex.key, { carga_kg: e.target.value })
                                }
                              />
                            </label>
                            <label className="text-sm">
                              Descanso (segundos)
                              <Input
                                type="number"
                                min={0}
                                max={1800}
                                value={ex.descanso_seg}
                                onChange={(e) =>
                                  edit(ex.key, {
                                    descanso_seg: Number(e.target.value),
                                  })
                                }
                              />
                            </label>
                            <label className="text-sm">
                              Dia
                              <select
                                className={selectClass}
                                value={ex.dia_semana}
                                onChange={(e) =>
                                  edit(ex.key, {
                                    dia_semana: Number(e.target.value),
                                  })
                                }
                              >
                                {WEEKDAYS.map((n, i) => (
                                  <option key={n} value={i + 1}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <label className="block text-sm">
                            Orientação para o morador
                            <Textarea
                              maxLength={2000}
                              value={ex.observacoes}
                              onChange={(e) =>
                                edit(ex.key, { observacoes: e.target.value })
                              }
                            />
                          </label>
                          <CoachAlternatives
                            exercise={ex}
                            library={library}
                            unavailable={unavailable}
                            onChange={(alternativas) =>
                              edit(ex.key, { alternativas })
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const { data, error } = await (
                                  supabase as any
                                ).rpc("exercise_substitutions", {
                                  p_exercise_id: ex.exercicio_id,
                                });
                                if (error) throw error;
                                setSubstitutions((old) => ({
                                  ...old,
                                  [ex.key]: data || [],
                                }));
                              } catch {
                                toast.error(
                                  "Não foi possível consultar alternativas.",
                                );
                              }
                            }}
                          >
                            Substituir exercício
                          </Button>
                          {substitutions[ex.key] && (
                            <div className="space-y-2">
                              {!substitutions[ex.key].length && (
                                <p className="text-sm">
                                  Nenhuma alternativa cadastrada.
                                </p>
                              )}
                              {substitutions[ex.key].map((rule) => {
                                const alt = library.find(
                                    (e) => e.id === rule.substitute_exercise_id,
                                  ),
                                  why = alt
                                    ? unavailable(alt)
                                    : "Alternativa indisponível no catálogo";
                                return (
                                  <div
                                    key={rule.id}
                                    className="rounded border p-3 text-sm"
                                  >
                                    <p>
                                      {alt?.nome || "Exercício indisponível"} ·{" "}
                                      {rule.motivo}
                                    </p>
                                    {why && <p>{why}</p>}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={!!why}
                                      onClick={() => {
                                        if (
                                          !alt ||
                                          !confirm(
                                            "Substituir por " +
                                              alt.nome +
                                              "? Séries, carga e descanso serão mantidos para sua revisão.",
                                          )
                                        )
                                          return;
                                        edit(ex.key, {
                                          exercicio_id: alt.id,
                                          nome: alt.nome,
                                          alternativas: [],
                                          observacoes: ex.observacoes,
                                        });
                                        setSubstitutions((old) => ({
                                          ...old,
                                          [ex.key]: [],
                                        }));
                                      }}
                                    >
                                      Confirmar substituição
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  {!draft.exercicios.some((e) => e.dia_semana === day) && (
                    <p className="rounded-lg border border-dashed p-6 text-sm">
                      Nenhum exercício neste dia. Use a busca acima para
                      começar.
                    </p>
                  )}
                </div>
              </div>
            )}
            {step === 2 && (
              <section className="space-y-4 rounded-xl border p-5">
                <h2 className="text-xl font-semibold">{draft.nome}</h2>
                <p>
                  {draft.objetivo} · {draft.nivel}
                </p>
                <p>
                  Início: {residentDate(draft.data_inicio)} · {draft.semanas}{" "}
                  semanas ·{" "}
                  {new Set(draft.exercicios.map((e) => e.dia_semana)).size} dias
                  por semana
                </p>
                <p className="text-sm text-muted-foreground">
                  A semana se repete durante a validade. A publicação depende da
                  validação atual do servidor.
                </p>
                {initialWorkoutId && <p>Motivo da revisão: {reason}</p>}
                {WEEKDAYS.map((name, i) => {
                  const rows = draft.exercicios.filter(
                    (e) => e.dia_semana === i + 1,
                  );
                  return rows.length ? (
                    <div key={name} className="space-y-2">
                      <h3 className="font-semibold">{name}</h3>
                      {rows.map((ex) => (
                        <article
                          key={ex.key}
                          className="rounded-lg bg-muted p-3"
                        >
                          <p className="font-medium">{ex.nome}</p>
                          {(ex.alternativas || []).map((a) => (
                            <p key={a.exercicio_id} className="text-sm">
                              Alternativa aprovada: {a.nome} · {a.series} ×{" "}
                              {a.repeticoes} ·{" "}
                              {a.carga_kg === ""
                                ? "Carga orientada"
                                : a.carga_kg + " kg"}{" "}
                              · {a.descanso_seg}s
                            </p>
                          ))}
                          <p className="text-sm">
                            {ex.series} × {ex.repeticoes} ·{" "}
                            {ex.carga_kg === ""
                              ? "Carga não informada"
                              : ex.carga_kg + " kg"}{" "}
                            · Descanso {ex.descanso_seg}s
                          </p>
                          <p className="whitespace-pre-wrap text-sm">
                            {ex.observacoes || "Sem orientação adicional"}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : null;
                })}
              </section>
            )}
          </fieldset>
          <footer className="sticky bottom-0 flex flex-wrap gap-3 rounded-xl border bg-background p-4">
            <Button variant="outline" disabled={saving} onClick={close}>
              Salvar e sair
            </Button>
            {step > 0 && (
              <Button
                variant="ghost"
                disabled={saving || pendingPublication}
                onClick={() => setStep((s) => s - 1)}
              >
                Voltar
              </Button>
            )}
            {step < 2 ? (
              <Button
                disabled={saving || !!planBlocked || contextLoading}
                onClick={() => {
                  if (step === 1) {
                    const error = validate();
                    if (error) return setError(error);
                  }
                  if (step === 0 && !draft.aluno_id)
                    return setError("Escolha o morador.");
                  setStep((s) => s + 1);
                }}
              >
                {step === 0 ? "Montar treino" : "Conferir prescrição"}
              </Button>
            ) : (
              <Button disabled={saving || !eligible} onClick={publish}>
                {saving
                  ? "Confirmando publicação…"
                  : pendingPublication
                    ? "Consultar e repetir publicação"
                    : "Publicar treino para " +
                      (alunos.find((a) => a.id === draft.aluno_id)?.nome ||
                        "morador")}
              </Button>
            )}
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => {
                if (!confirm("Descartar este rascunho?")) return;
                try {
                  localStorage.removeItem(key);
                } catch {
                  /* Optional browser draft. */
                }
                confirmed.current = true;
                setDraft(newDraft(initialAlunoId));
                close();
              }}
            >
              Descartar rascunho
            </Button>
          </footer>
        </>
      )}
    </div>
  );
  if (embedded) return <section className="mx-auto max-w-6xl">{body}</section>;
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!locked.current) setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        {trigger || <Button>Novo treino</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto">
        <DialogTitle className="sr-only">Montar e publicar treino</DialogTitle>
        {body}
      </DialogContent>
    </Dialog>
  );
}
