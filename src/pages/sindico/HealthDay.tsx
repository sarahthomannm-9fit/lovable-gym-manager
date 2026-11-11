import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PersonaLayout, PersonaEmptyState } from "@/layouts/PersonaLayout";
import { useOperationalContext } from "@/hooks/useOperationalContext";
import { useSyndicMutation } from "@/hooks/useSyndicMutation";
import { useResidentDraftGuard } from "@/hooks/useResidentDraftGuard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { residentDate, residentInstant } from "@/lib/resident";
import { participantsCsv, eventStatus } from "@/lib/syndic";
import { HealthDayReception } from "./HealthDayReception";
import { HealthDayImpact } from "./HealthDayImpact";
import { toast } from "sonner";
const blank = () => ({
  name: "Health Day",
  description: "",
  date: "",
  start: "",
  end: "",
  capacity: "",
  location: "",
});
export default function HealthDay() {
  const { activeOrg } = useOperationalContext();
  const [params, setParams] = useSearchParams();
  const edit = params.get("edit"),
    eventId = params.get("event"),
    panel = params.get("panel") || "participantes";
  const [events, setEvents] = useState<any[] | null>(null),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [participants, setParticipants] = useState<any[] | null>(null),
    [participantError, setParticipantError] = useState(""),
    [search, setSearch] = useState(""),
    [busy, setBusy] = useState(false);
  const [form, setForm] = useState(blank()),
    [initial, setInitial] = useState(""),
    [review, setReview] = useState(false);
  const initialized = useRef<string | null>(null),
    participantLock = useRef(false);
  const mutation = useSyndicMutation(activeOrg?.id);
  const dirty = !!edit && !!initial && initial !== JSON.stringify(form);
  const allowNavigation = useResidentDraftGuard(
    dirty || mutation.pending || mutation.busy,
  );
  useEffect(() => {
    let live = true;
    setError("");
    void (async () => {
      try {
        if (!activeOrg) throw new Error("Selecione um condomínio.");
        const { data, error } = await (supabase as any).rpc(
          "syndic_event_list",
          { p_org: activeOrg.id },
        );
        if (error) throw error;
        if (live) setEvents(data || []);
      } catch (e) {
        if (live)
          setError(
            (e as Error).message || "Não foi possível consultar os eventos.",
          );
      }
    })();
    return () => {
      live = false;
    };
  }, [activeOrg?.id, revision]);
  useEffect(() => {
    if (!edit) {
      initialized.current = null;
      return;
    }
    if (initialized.current === edit || events === null) return;
    const e = events.find((e) => e.id === edit);
    if (edit !== "new" && !e) return;
    const value =
      edit === "new"
        ? blank()
        : {
            name: e.nome,
            description: e.descricao || "",
            date: e.data_evento,
            start: e.horario_inicio?.slice(0, 5) || "",
            end: e.horario_fim?.slice(0, 5) || "",
            capacity: String(e.vagas_totais),
            location: e.local || "",
          };
    setForm(value);
    setInitial(JSON.stringify(value));
    setReview(false);
    initialized.current = edit;
  }, [edit, events]);
  useEffect(() => {
    let live = true;
    setParticipants(null);
    setParticipantError("");
    setSearch("");
    if (!eventId) return;
    void (async () => {
      try {
        const { data, error } = await (supabase as any).rpc(
          "event_participants",
          { p_event: eventId },
        );
        if (error) throw error;
        if (live)
          setParticipants(
            (data || []).map((p: any) => ({
              ...p,
              alunos: { nome: p.nome, email: p.email },
            })),
          );
      } catch {
        if (live)
          setParticipantError(
            "Não foi possível consultar os participantes deste evento.",
          );
      }
    })();
    return () => {
      live = false;
    };
  }, [eventId, activeOrg?.id, revision]);
  const patch = (values: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(values).forEach(([k, v]) =>
      v === null ? next.delete(k) : next.set(k, v),
    );
    setParams(next);
  };
  const validate = () => {
    if (
      form.name.trim().length < 3 ||
      !form.date ||
      !form.start ||
      !form.end ||
      !form.location.trim()
    )
      return "Informe nome, data, horários e local.";
    const start = residentInstant(form.date + "T" + form.start),
      end = residentInstant(form.date + "T" + form.end);
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      start <= new Date() ||
      end <= start
    )
      return "Confira a data futura e o fim após o início.";
    if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1)
      return "Informe a capacidade real do evento.";
    return "";
  };
  const save = () => {
    const failure = validate();
    if (failure) return toast.error(failure);
    void mutation.execute(
      "event",
      edit === "new" ? null : edit,
      {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        capacity: Number(form.capacity),
      },
      (id) => {
        setInitial(JSON.stringify(form));
        allowNavigation();
        setRevision((v) => v + 1);
        setParams({ event: id });
        toast.success("Evento salvo. A publicação é uma decisão separada.");
      },
    );
  };
  const transition = (e: any, status: string) => {
    if (
      !confirm(
        (status === "publicado"
          ? "Publicar este evento e abrir inscrições?"
          : status === "encerrado"
            ? "Encerrar inscrições e operação deste evento? O histórico será preservado."
            : "Cancelar o evento e suas inscrições? O histórico será preservado.") +
          " " +
          e.nome,
      )
    )
      return;
    void mutation.execute("event_status", e.id, { status }, () => {
      setRevision((v) => v + 1);
      toast.success("Situação do evento confirmada.");
    });
  };
  const updateParticipant = async (id: string, status: string) => {
    if (participantLock.current) return;
    if (
      !confirm(
        status === "cancelado"
          ? "Cancelar esta inscrição e atualizar a fila de espera?"
          : "Confirmar esta vaga se houver disponibilidade?",
      )
    )
      return;
    participantLock.current = true;
    setBusy(true);
    try {
      const { error } = await (supabase as any).rpc(
        "manage_health_day_registration",
        { p_registration_id: id, p_status: status },
      );
      if (error) throw error;
      setRevision((v) => v + 1);
      toast.success("Inscrição atualizada no servidor.");
    } catch (e) {
      toast.error((e as Error).message || "Falha ao atualizar inscrição.");
    } finally {
      participantLock.current = false;
      setBusy(false);
    }
  };
  const selected = events?.find((e) => e.id === eventId);
  const copy = async (e: any, entry: boolean) => {
    const url = new URL(
      entry ? "/entrada" : "/health-day/" + e.id,
      window.location.origin,
    );
    if (entry) {
      url.searchParams.set("organization", activeOrg!.id);
      url.searchParams.set("health_day", e.id);
    }
    try {
      await navigator.clipboard.writeText(url.href);
      toast.success(
        entry
          ? "Link de acesso ao aplicativo copiado."
          : "Link de solicitação de participação copiado.",
      );
    } catch {
      toast.error("Não foi possível copiar. Tente novamente.");
    }
  };
  const exportCsv = () => {
    if (!selected || participants === null || participantError) return;
    const exported = new Date().toISOString();
    const url = URL.createObjectURL(
      new Blob([participantsCsv(selected, participants, exported)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "health-day-" + selected.id + "-" + exported.slice(0, 10) + ".csv";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <PersonaLayout title="Eventos">
      {!activeOrg ? (
        <PersonaEmptyState />
      ) : (
        <div className="mx-auto max-w-4xl space-y-5">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold">Eventos e Health Day</h1>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={mutation.busy || mutation.pending}
                onClick={() => {
                  if (dirty && !confirm("Descartar a edição atual?")) return;
                  allowNavigation();
                  initialized.current = null;
                  setParams({ edit: "new" });
                }}
              >
                Novo evento
              </Button>
              <Button
                variant="outline"
                onClick={() => setRevision((v) => v + 1)}
              >
                Atualizar
              </Button>
            </div>
          </header>
          {(error || mutation.error) && (
            <div
              role="alert"
              className="space-y-3 rounded-lg border border-destructive p-4"
            >
              <p>{error || mutation.error}</p>
              {mutation.pending && (
                <Button
                  disabled={mutation.busy}
                  onClick={() => void mutation.retry()}
                >
                  Repetir pedido pendente
                </Button>
              )}
            </div>
          )}
          {edit && (
            <section className="space-y-4 rounded-xl border p-5">
              <h2 className="text-xl font-semibold">
                {review
                  ? "Conferir evento"
                  : edit === "new"
                    ? "Preparar novo evento"
                    : "Editar evento"}
              </h2>
              {initialized.current !== edit ? (
                <p>
                  {events === null
                    ? "Carregando evento…"
                    : "Evento indisponível para edição."}
                </p>
              ) : (
                <fieldset
                  disabled={mutation.busy || mutation.pending}
                  className="space-y-4"
                >
                  {!review ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {[
                          ["Nome", "name", "text"],
                          ["Data", "date", "date"],
                          ["Início · Brasília", "start", "time"],
                          ["Fim · Brasília", "end", "time"],
                          ["Capacidade real", "capacity", "number"],
                          ["Local", "location", "text"],
                        ].map(([label, key, type]) => (
                          <label key={key} className="block text-sm">
                            {label}
                            <Input
                              type={type}
                              min={type === "number" ? 1 : undefined}
                              maxLength={200}
                              value={(form as any)[key]}
                              onChange={(e) =>
                                setForm((old) => ({
                                  ...old,
                                  [key]: e.target.value,
                                }))
                              }
                              placeholder={
                                key === "capacity"
                                  ? "Confirme espaço e equipe"
                                  : undefined
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <label className="block text-sm">
                        Descrição
                        <Textarea
                          rows={4}
                          maxLength={4000}
                          value={form.description}
                          onChange={(e) =>
                            setForm((old) => ({
                              ...old,
                              description: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Apartamentos não equivalem a participantes. Defina a
                        capacidade com a equipe; a solicitação pública não
                        garante vaga.
                      </p>
                      <Button
                        onClick={() => {
                          const failure = validate();
                          if (failure) return toast.error(failure);
                          setReview(true);
                        }}
                      >
                        Conferir antes de salvar
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold">{form.name}</h3>
                      <p>
                        {residentDate(form.date)} · {form.start}–{form.end} ·
                        Brasília
                      </p>
                      <p>
                        {form.location} · {form.capacity} vagas
                      </p>
                      <p className="whitespace-pre-wrap text-sm">
                        {form.description}
                      </p>
                      <p className="text-sm">
                        Salvar não publica um evento novo. Ao editar evento
                        publicado, a atualização passa a valer após a
                        confirmação.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={save}>Confirmar e salvar</Button>
                        <Button
                          variant="outline"
                          onClick={() => setReview(false)}
                        >
                          Voltar à edição
                        </Button>
                      </div>
                    </>
                  )}
                </fieldset>
              )}
            </section>
          )}
          {events === null ? (
            !error && <p role="status">Carregando eventos…</p>
          ) : !events.length ? (
            <p>Nenhum evento registrado.</p>
          ) : eventId ? (
            selected ? (
              <section className="space-y-4">
                <Button
                  variant="ghost"
                  onClick={() => patch({ event: null, panel: null })}
                >
                  Voltar aos eventos
                </Button>
                <article className="space-y-3 rounded-xl border bg-card p-5">
                  <h2 className="text-2xl font-semibold">{selected.nome}</h2>
                  <p>
                    {residentDate(selected.data_evento)} ·{" "}
                    {selected.horario_inicio?.slice(0, 5)} ·{" "}
                    {selected.local || "Local não definido"}
                  </p>
                  <p>
                    {eventStatus[selected.status] || selected.status} ·{" "}
                    {selected.confirmed}/{selected.vagas_totais} vagas ocupadas
                    · {selected.waiting} em espera · {selected.present}{" "}
                    presenças · {selected.unverified} solicitações a verificar
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["participantes", "recepcao", "resultado"].map((value) => (
                      <Button
                        key={value}
                        variant={panel === value ? "default" : "outline"}
                        onClick={() => patch({ panel: value })}
                      >
                        {value === "recepcao"
                          ? "Recepção"
                          : value === "resultado"
                            ? "Resultado agregado"
                            : "Participantes"}
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["rascunho", "publicado"].includes(selected.status) && (
                      <Button
                        variant="outline"
                        disabled={mutation.busy || mutation.pending}
                        onClick={() => patch({ edit: selected.id })}
                      >
                        Editar
                      </Button>
                    )}
                    {selected.status === "rascunho" && (
                      <Button
                        disabled={mutation.busy || mutation.pending}
                        onClick={() => transition(selected, "publicado")}
                      >
                        Publicar evento
                      </Button>
                    )}
                    {selected.status === "publicado" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => void copy(selected, false)}
                        >
                          Copiar link de inscrição
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => void copy(selected, true)}
                        >
                          Copiar acesso ao app
                        </Button>
                        <Button
                          variant="outline"
                          disabled={mutation.busy || mutation.pending}
                          onClick={() => transition(selected, "encerrado")}
                        >
                          Encerrar evento
                        </Button>
                      </>
                    )}
                    {!["encerrado", "cancelado"].includes(selected.status) && (
                      <Button
                        variant="ghost"
                        disabled={mutation.busy || mutation.pending}
                        onClick={() => transition(selected, "cancelado")}
                      >
                        Cancelar evento
                      </Button>
                    )}
                  </div>
                </article>
                {panel === "resultado" ? (
                  <HealthDayImpact
                    key={selected.id}
                    eventId={selected.id}
                    name={selected.nome}
                  />
                ) : participantError ? (
                  <div role="alert">
                    <p>{participantError}</p>
                    <Button
                      variant="outline"
                      onClick={() => setRevision((v) => v + 1)}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : participants === null ? (
                  <p role="status">Carregando participantes deste evento…</p>
                ) : panel === "recepcao" ? (
                  <HealthDayReception
                    key={selected.id}
                    eventId={selected.id}
                    confirmed={participants.filter(
                      (p) => p.status === "confirmado",
                    )}
                    onChange={() => setRevision((v) => v + 1)}
                  />
                ) : (
                  <section className="space-y-3 rounded-xl border p-5">
                    <h3 className="text-xl font-semibold">Participantes</h3>
                    <p className="text-sm text-muted-foreground">
                      Dados de participação autorizados. A exportação não inclui
                      anamnese, diagnóstico nem medicamentos.
                    </p>
                    <Input
                      aria-label="Buscar participante"
                      placeholder="Nome ou e-mail"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button variant="outline" onClick={exportCsv}>
                      Exportar participantes deste evento
                    </Button>
                    {participants
                      .filter((p) =>
                        (p.nome + " " + p.email)
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((p) => (
                        <article
                          key={p.id}
                          className="flex flex-wrap items-center justify-between gap-3 border-b py-3"
                        >
                          <div>
                            <p className="font-medium">{p.nome}</p>
                            <p className="text-sm">
                              {p.email} · {eventStatus[p.status] || p.status}
                            </p>
                          </div>
                          {!["cancelado", "encerrado"].includes(
                            selected.status,
                          ) && (
                            <div className="flex flex-wrap gap-2">
                              {p.status === "lista_espera" && (
                                <Button
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() =>
                                    void updateParticipant(p.id, "confirmado")
                                  }
                                >
                                  Confirmar vaga
                                </Button>
                              )}
                              {["lista_espera", "confirmado"].includes(
                                p.status,
                              ) && (
                                <Button
                                  variant="ghost"
                                  disabled={busy}
                                  onClick={() =>
                                    void updateParticipant(p.id, "cancelado")
                                  }
                                >
                                  Cancelar inscrição
                                </Button>
                              )}
                            </div>
                          )}
                        </article>
                      ))}
                    {!participants.length && (
                      <p>Nenhum participante registrado.</p>
                    )}
                  </section>
                )}
              </section>
            ) : (
              <p role="alert">Evento não disponível neste condomínio.</p>
            )
          ) : (
            <div className="space-y-3">
              {events.map((e) => (
                <article key={e.id} className="space-y-3 rounded-xl border p-5">
                  <h2 className="text-xl font-semibold">{e.nome}</h2>
                  <p>
                    {residentDate(e.data_evento)} ·{" "}
                    {e.horario_inicio?.slice(0, 5)} ·{" "}
                    {eventStatus[e.status] || e.status}
                  </p>
                  <p className="text-sm">
                    {e.confirmed}/{e.vagas_totais} vagas ocupadas · {e.present}{" "}
                    presenças
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        patch({
                          event: e.id,
                          edit: null,
                          panel: "participantes",
                        })
                      }
                    >
                      Abrir evento
                    </Button>
                    <Button
                      onClick={() =>
                        patch({ event: e.id, edit: null, panel: "recepcao" })
                      }
                    >
                      Abrir recepção
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        patch({ event: e.id, edit: null, panel: "resultado" })
                      }
                    >
                      Ver resultado
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </PersonaLayout>
  );
}
