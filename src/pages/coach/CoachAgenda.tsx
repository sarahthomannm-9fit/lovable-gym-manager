import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { residentDate, residentInstant } from "@/lib/resident";
import { localDate } from "@/lib/workout";
import { toast } from "sonner";
export function CoachAgenda({
  organizationId,
  students,
}: {
  organizationId: string;
  students: any[];
}) {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const range = params.get("period") || "hoje",
    selected = params.get("class");
  const [classes, setClasses] = useState<any[]>([]),
    [enrolled, setEnrolled] = useState<any[] | null>(null),
    [error, setError] = useState(""),
    [listError, setListError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const locked = useRef(false),
    live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setClasses([]);
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const db = supabase as any;
        const staff = await db
          .from("funcionarios")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("user_id", user?.id)
          .eq("ativo", true)
          .maybeSingle();
        if (staff.error) throw staff.error;
        if (!staff.data)
          throw new Error(
            "Esta conta não possui agenda profissional ativa neste condomínio. A pré-visualização administrativa não cria esse vínculo.",
          );
        let query = db
          .from("aulas")
          .select(
            "id,nome,data_aula,horario_inicio,horario_fim,status,capacidade_maxima,inscritos_atual",
          )
          .eq("organization_id", organizationId)
          .eq("professor_id", staff.data.id);
        const today = localDate();
        if (range === "hoje") query = query.eq("data_aula", today);
        else if (range === "historico") query = query.lt("data_aula", today);
        else query = query.gte("data_aula", today);
        const { data, error } = await query
          .order("data_aula", { ascending: range !== "historico" })
          .order("horario_inicio")
          .limit(100);
        if (error) throw error;
        if (active) setClasses(data || []);
      } catch (e) {
        if (active)
          setError(
            (e as Error).message || "Não foi possível consultar sua agenda.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [organizationId, user?.id, range, revision]);
  useEffect(() => {
    let active = true;
    setEnrolled(null);
    setListError("");
    if (!selected) return;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("aulas_inscritos")
          .select("id,aluno_id,status")
          .eq("aula_id", selected)
          .in("status", ["inscrito", "presente"]);
        if (error) throw error;
        if (active) setEnrolled(data || []);
      } catch {
        if (active) setListError("Não foi possível consultar inscritos.");
      }
    })();
    return () => {
      active = false;
    };
  }, [selected, organizationId, revision]);
  const patch = (values: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(values).forEach(([k, v]) =>
      v === null ? next.delete(k) : next.set(k, v),
    );
    setParams(next);
  };
  const perform = async (task: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      await task();
      if (live.current) {
        toast.success("Registro confirmado.");
        setRevision((v) => v + 1);
      }
    } catch (e) {
      if (live.current)
        toast.error((e as Error).message || "Não foi possível confirmar.");
    } finally {
      locked.current = false;
      if (live.current) setBusy(false);
    }
  };
  const chosen = classes.find((c) => c.id === selected);
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Sua agenda</h2>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => setRevision((v) => v + 1)}
        >
          Atualizar
        </Button>
      </header>
      <p className="text-sm text-muted-foreground">
        Horário do condomínio · Brasília. Até 100 atividades por período.
        Preferências de horário em solicitações não são compromissos
        confirmados.
      </p>
      <div className="flex flex-wrap gap-2">
        {[
          ["hoje", "Hoje"],
          ["proximos", "Próximos dias"],
          ["historico", "Histórico"],
        ].map(([value, label]) => (
          <Button
            key={value}
            variant={range === value ? "default" : "outline"}
            onClick={() => patch({ period: value, class: null })}
          >
            {label}
          </Button>
        ))}
      </div>
      {loading ? (
        <p role="status">Carregando agenda…</p>
      ) : error ? (
        <div role="alert">
          {error}
          <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Tentar novamente
          </Button>
        </div>
      ) : !classes.length ? (
        <p>Nenhuma aula neste período.</p>
      ) : (
        classes.map((c) => {
          const start = residentInstant(
            c.data_aula + "T" + c.horario_inicio?.slice(0, 5),
          );
          const windowOpen = now >= start.getTime() - 15 * 60000;
          return (
            <article
              key={c.id}
              className={
                "space-y-3 rounded-xl border p-5 " +
                (selected === c.id ? "border-primary" : "")
              }
            >
              <h3 className="text-lg font-semibold">{c.nome}</h3>
              <p>
                {residentDate(c.data_aula)} · {c.horario_inicio?.slice(0, 5)}–
                {c.horario_fim?.slice(0, 5)}
              </p>
              <p className="text-sm">
                {c.status === "cancelada" ? "Aula cancelada" : c.status} ·{" "}
                {c.inscritos_atual ?? 0}/{c.capacidade_maxima ?? "—"} inscrições
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => patch({ class: c.id })}
                >
                  Ver inscritos e presença
                </Button>
                {c.status !== "cancelada" && range !== "historico" && (
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      if (
                        confirm(
                          "Cancelar " +
                            c.nome +
                            " em " +
                            residentDate(c.data_aula) +
                            "? Os inscritos verão a atividade cancelada.",
                        )
                      )
                        void perform(async () => {
                          const { error } = await (supabase as any).rpc(
                            "cancel_coach_class",
                            { p_aula: c.id },
                          );
                          if (error) throw error;
                        });
                    }}
                  >
                    Cancelar aula
                  </Button>
                )}
              </div>
              {selected === c.id && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold">Lista de presença</h4>
                  {!windowOpen && c.status !== "cancelada" && (
                    <p className="text-sm text-muted-foreground">
                      Registro sujeito à janela de atendimento e às regras do
                      servidor.
                    </p>
                  )}
                  {listError ? (
                    <p role="alert">{listError}</p>
                  ) : enrolled === null ? (
                    <p role="status">Carregando inscritos desta aula…</p>
                  ) : !enrolled.length ? (
                    <p>Nenhum inscrito confirmado.</p>
                  ) : (
                    enrolled.map((row) => (
                      <div
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"
                      >
                        <p>
                          {students.find((s) => s.id === row.aluno_id)?.nome ||
                            "Morador autorizado"}
                        </p>
                        {row.status === "presente" ? (
                          <strong className="text-sm">
                            Presença registrada
                          </strong>
                        ) : (
                          <Button
                            variant="outline"
                            disabled={
                              busy || c.status === "cancelada" || !windowOpen
                            }
                            onClick={() =>
                              perform(async () => {
                                const { error } = await (supabase as any).rpc(
                                  "mark_class_attendance",
                                  { p_aula_id: c.id, p_aluno_id: row.aluno_id },
                                );
                                if (error) throw error;
                              })
                            }
                          >
                            Marcar presença
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </article>
          );
        })
      )}
      {selected && !loading && !chosen && (
        <p role="alert">
          Esta aula não está disponível no período selecionado.
        </p>
      )}
    </section>
  );
}
