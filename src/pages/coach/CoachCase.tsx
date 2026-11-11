import { useResidentDraftGuard } from "@/hooks/useResidentDraftGuard";
import { SupportTickets } from "@/components/SupportTickets";
import { FitnessInfrastructure } from "@/components/FitnessInfrastructure";
import { CoachPlanPreview } from "@/components/coach/CoachPlanPreview";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HealthCapture } from "@/components/coach/HealthCapture";
import { SaveWorkoutProtocol } from "@/components/treinos/SaveWorkoutProtocol";
import { residentDate } from "@/lib/resident";
import { localDate } from "@/lib/workout";
import { activeCoachWorkout, currentCoachWorkout } from "@/lib/coach";
import { toast } from "sonner";
export function CoachCase({
  studentId,
  organizationId,
  onBack,
}: {
  studentId: string;
  organizationId: string;
  onBack: () => void;
}) {
  const [data, setData] = useState<any>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false);
  const [reason, setReason] = useState(""),
    [notes, setNotes] = useState<Record<string, string>>({}),
    [resolved, setResolved] = useState<Record<string, boolean>>({});
  const locked = useRef(false),
    live = useRef(true);
  const [params] = useSearchParams();
  const [supportDirty, setSupportDirty] = useState(false);
  const followupDirty = Boolean(
    data &&
      Object.entries(notes).some(([id, note]) => {
        const original = data.followups.find((f: any) => f.session_id === id);
        return (
          note !== (original?.note || "") ||
          (resolved[id] ?? false) !== (original?.resolved ?? false)
        );
      }),
  );
  useResidentDraftGuard(supportDirty || followupDirty || busy);

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setData(null);
    setError("");
    void (async () => {
      try {
        const { data, error } = await (supabase as any).rpc(
          "coach_student_case",
          { p_student: studentId },
        );
        if (error || data?.student?.organization_id !== organizationId)
          throw error || new Error("Morador fora do condomínio selecionado.");
        if (active) {
          setData(data);
          setNotes(
            Object.fromEntries(
              (data.followups || []).map((r: any) => [r.session_id, r.note]),
            ),
          );
          setResolved(
            Object.fromEntries(
              (data.followups || []).map((r: any) => [
                r.session_id,
                r.resolved,
              ]),
            ),
          );
        }
      } catch (e) {
        if (active)
          setError(
            (e as Error).message || "Não foi possível consultar o atendimento.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [studentId, organizationId, revision]);
  useEffect(() => {
    if (loading || !params.get("section")) return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById("coach-" + params.get("section"));
      if (target) {
        target.scrollIntoView({ block: "start" });
        target.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [loading, params]);
  const perform = async (task: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      await task();
      if (live.current) {
        setRevision((v) => v + 1);
        toast.success("Registro confirmado.");
      }
    } catch (e) {
      if (live.current)
        toast.error((e as Error).message || "Não foi possível registrar.");
    } finally {
      locked.current = false;
      if (live.current) setBusy(false);
    }
  };
  if (loading) return <p role="status">Carregando atendimento…</p>;
  if (error)
    return (
      <div role="alert" className="space-y-3">
        <p>{error}</p>
        <Button onClick={() => setRevision((v) => v + 1)}>
          Tentar novamente
        </Button>
        <Button variant="outline" onClick={onBack}>
          Voltar aos atendimentos
        </Button>
      </div>
    );
  const q = data.queue,
    clinical =
      q &&
      (q.status === "rejeitado" || (!q.anamnese_id && q.status === "pendente"));
  const returnTo =
    "&return=" + encodeURIComponent("/coach?" + params.toString());
  const editor =
    "/coach/prescricao?student=" +
    studentId +
    (q?.status === "pendente" && q.anamnese_id ? "&queue=" + q.id : "") +
    returnTo;
  const current = currentCoachWorkout(data.workouts || [], localDate());
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="space-y-3 rounded-xl border bg-card p-5">
        <Button variant="ghost" onClick={onBack}>
          Voltar aos atendimentos
        </Button>
        <h1 className="text-2xl font-semibold">{data.student.nome}</h1>
        <p className="text-sm">
          Cadastro: {data.student.status} · Situação:{" "}
          {data.student.lifecycle_status}
        </p>
        <p className="font-medium">
          {data.can_prescribe
            ? "Pode preparar uma prescrição para conferência"
            : "Avaliação ou liberação necessária antes de publicar"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to={editor}>Montar treino</Link>
          </Button>
          {current && (
            <Button asChild variant="outline">
              <Link
                to={
                  "/coach/prescricao?student=" +
                  studentId +
                  "&workout=" +
                  current.id +
                  returnTo
                }
              >
                Revisar plano atual
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Atualizar atendimento
          </Button>
        </div>
      </header>
      <details
        id="coach-avaliacao"
        tabIndex={-1}
        key={params.get("section") || "context"}
        open={params.get("section") === "avaliacao"}
        className="rounded-xl border p-5"
      >
        <summary className="min-h-11 cursor-pointer text-lg font-semibold">
          Avaliação e respostas completas
        </summary>
        <div className="mt-4 space-y-4">
          <HealthCapture capture={data.capture} safety={data.safety} />
          {clinical && (
            <section className="space-y-3 rounded-lg border p-4">
              <h2 className="font-semibold">Registrar decisão profissional</h2>
              <p className="text-sm">
                Avaliar permite ou mantém o encaminhamento para prescrição. Esta
                decisão não publica um treino. Ausência de protocolo e condição
                de saúde devem ser consideradas separadamente.
              </p>
              <label className="block text-sm">
                Justificativa e orientação
                <Textarea
                  maxLength={2000}
                  value={reason}
                  disabled={busy}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  ["aprovado", "Aprovar para prescrição"],
                  ["rejeitado", "Manter encaminhamento"],
                ].map(([decision, label]) => (
                  <Button
                    key={decision}
                    variant={decision === "aprovado" ? "default" : "outline"}
                    disabled={busy || reason.trim().length < 3}
                    onClick={() =>
                      perform(async () => {
                        const { error } = await (supabase as any).rpc(
                          "review_student_safety_decision",
                          {
                            p_queue: q.id,
                            p_decision: decision,
                            p_reason: reason.trim(),
                          },
                        );
                        if (error) throw error;
                        setReason("");
                      })
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </section>
          )}
          <p className="text-sm">
            Equipamentos aprovados:{" "}
            {data.equipment?.join(", ") || "Nenhum cadastrado"}
          </p>
        </div>
      </details>
      <section
        className="space-y-3 rounded-xl border p-5"
        id="coach-planos"
        tabIndex={-1}
      >
        <h2 className="text-xl font-semibold">Planos e versões</h2>
        {!data.workouts.length && <p>Nenhum plano registrado.</p>}
        {data.workouts.map((w: any) => (
          <article key={w.id} className="space-y-2 border-b py-3">
            <h3 className="font-medium">{w.nome || w.descricao || "Plano"}</h3>
            <p className="text-sm">
              {residentDate(w.data_inicio)} até {residentDate(w.data_fim)} ·{" "}
              {activeCoachWorkout(w, localDate())
                ? w.id === current?.id
                  ? "Plano atual publicado"
                  : "Plano anterior dentro da validade"
                : w.status +
                  (w.published
                    ? " · publicado"
                    : " · sem publicação confirmada")}
            </p>
            <CoachPlanPreview key={w.id} planId={w.plano_treino_id} />
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link
                  to={
                    "/coach/prescricao?student=" +
                    studentId +
                    "&workout=" +
                    w.id +
                    returnTo
                  }
                >
                  Abrir revisão
                </Link>
              </Button>
              {w.published && <SaveWorkoutProtocol workoutId={w.id} />}
            </div>
          </article>
        ))}
      </section>
      <section className="space-y-3 rounded-xl border p-5">
        <h2
          id="coach-feedback"
          tabIndex={-1}
          className="scroll-mt-40 text-xl font-semibold"
        >
          Sessões e feedback
        </h2>
        <p className="text-sm text-muted-foreground">
          As notas de acompanhamento são internas da equipe. Respostas nos
          chamados de orientação são exibidas ao morador.
        </p>
        <p className="text-sm text-muted-foreground">
          Até 60 sessões mais recentes. Presença no prédio e em aula são
          registros diferentes.
        </p>
        <FitnessInfrastructure
          key={data.student.organization_id}
          orgId={data.student.organization_id}
        />
        <p className="text-sm text-muted-foreground">
          Nas últimas {data.sessions.length} sessões:{" "}
          {
            data.sessions.filter((s: any) => s.completion_kind === "partial")
              .length
          }{" "}
          parcial(is);{" "}
          {
            data.sessions.filter((s: any) =>
              Object.values(s.progress || {}).some(
                (r: any) => r.alternative_id,
              ),
            ).length
          }{" "}
          com alternativa registrada.
        </p>
        <SupportTickets
          key={data.student.id + ":support"}
          title="Dúvidas do morador ao coach"
          onDirtyChange={setSupportDirty}
          orgId={data.student.organization_id}
          alunoId={data.student.id}
          manage
        />
        {!data.sessions.length && <p>Nenhuma sessão registrada.</p>}
        {data.sessions.map((s: any) => {
          const f = data.followups.find((a: any) => a.session_id === s.id);
          return (
            <article key={s.id} className="space-y-3 rounded-lg border p-4">
              <p className="font-medium">
                {residentDate(s.data)} ·{" "}
                {s.status === "concluido"
                  ? s.completion_kind === "partial"
                    ? "Sessão parcial encerrada"
                    : "Treino concluído"
                  : s.status === "pausado"
                    ? "Treino pausado"
                    : "Em andamento"}
              </p>
              <p className="whitespace-pre-wrap text-sm">
                {s.feedback || "Sem observação enviada pelo morador"}
              </p>
              {s.attention === "discomfort" && (
                <p
                  role="status"
                  className="rounded border border-amber-500 p-3 text-sm"
                >
                  Relato de desconforto: revisar antes de orientar a
                  continuidade.
                </p>
              )}
              <details className="rounded border p-3">
                <summary className="min-h-11 cursor-pointer py-2">
                  Prescrito × realizado
                </summary>
                {(s.prescription?.exercicios || []).map((e: any) => {
                  const r = s.progress?.[e.id];
                  const actual =
                    e.alternativas?.find(
                      (a: any) => a.exercicio_id === r?.alternative_id,
                    ) || e;
                  return (
                    <article
                      key={e.id}
                      className="space-y-1 border-b py-3 text-sm"
                    >
                      <p className="font-medium">
                        {e.nome}
                        {r?.alternative_id
                          ? " → " + actual.nome + " (alternativa aprovada)"
                          : ""}
                      </p>
                      <p>
                        Prescrição usada: {actual.series} × {actual.repeticoes}{" "}
                        ·{" "}
                        {actual.carga_kg == null
                          ? "Carga orientada"
                          : actual.carga_kg + " kg"}{" "}
                        · descanso {actual.descanso_seg}s
                      </p>
                      <p>
                        {r?.completed ? "Realizado" : "Pendente"} · carga{" "}
                        {r?.carga || "não registrada"} · séries{" "}
                        {r?.series || "não registradas"} · repetições{" "}
                        {r?.repeticoes || "não registradas"}
                      </p>
                    </article>
                  );
                })}
                {!s.prescription && (
                  <p>
                    Esta sessão é anterior ao registro de versão da prescrição.
                  </p>
                )}
              </details>
              {f && (
                <p className="text-sm text-muted-foreground">
                  Atendimento{" "}
                  {f.resolved && f.updated_at >= s.updated_at
                    ? "registrado como concluído"
                    : "em acompanhamento"}{" "}
                  em {residentDate(f.updated_at, true)}. Orientação: {f.note}
                </p>
              )}
              {(s.feedback ||
                s.attention === "discomfort" ||
                s.completion_kind === "partial") && (
                <fieldset disabled={busy} className="space-y-2">
                  <label className="block text-sm">
                    Registro interno de orientação ou encaminhamento
                    <Textarea
                      maxLength={2000}
                      value={notes[s.id] || ""}
                      onChange={(e) =>
                        setNotes((old) => ({ ...old, [s.id]: e.target.value }))
                      }
                    />
                  </label>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={resolved[s.id] || false}
                      onChange={(e) =>
                        setResolved((old) => ({
                          ...old,
                          [s.id]: e.target.checked,
                        }))
                      }
                    />
                    Concluir este atendimento
                  </label>
                  <Button
                    variant="outline"
                    disabled={(notes[s.id] || "").trim().length < 3}
                    onClick={() =>
                      perform(async () => {
                        const { error } = await (supabase as any).rpc(
                          "record_coach_followup",
                          {
                            p_session: s.id,
                            p_note: notes[s.id].trim(),
                            p_resolved: !!resolved[s.id],
                          },
                        );
                        if (error) throw error;
                      })
                    }
                  >
                    Salvar orientação
                  </Button>
                </fieldset>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
