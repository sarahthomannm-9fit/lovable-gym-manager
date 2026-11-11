import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PersonaLayout } from "@/layouts/PersonaLayout";
import { useAlunoVinculo } from "@/hooks/useAlunoVinculo";
import { supabase } from "@/integrations/supabase/client";
import { localDate } from "@/lib/workout";
import { residentDate, residentStatus } from "@/lib/resident";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
export default function Events() {
  const {
    aluno,
    loading: linking,
    error: linkError,
    retry,
  } = useAlunoVinculo();
  const [params] = useSearchParams(),
    selected = params.get("event");
  const [events, setEvents] = useState<any[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false);
  const locked = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let live = true;
    setEvents([]);
    setLoading(true);
    setError("");
    if (!aluno?.organization_id) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const db = supabase as any;
        const [a, r] = await Promise.all([
          db
            .from("eventos_condominio")
            .select("*")
            .eq("organization_id", aluno.organization_id)
            .eq("status", "publicado")
            .eq("ativo", true)
            .order("data_evento", { ascending: false })
            .limit(100),
          db
            .from("health_day_inscricoes")
            .select("evento_id,status")
            .eq("aluno_id", aluno.id),
        ]);
        if (a.error || r.error) throw a.error || r.error;
        const regs = new Map(
          (r.data || []).map((x: any) => [x.evento_id, x.status]),
        );
        if (live)
          setEvents(
            (a.data || [])
              .map((x: any) => ({ ...x, registrationStatus: regs.get(x.id) }))
              .sort(
                (a: any, b: any) =>
                  Number(b.id === selected) - Number(a.id === selected) ||
                  Number(a.data_evento < localDate()) -
                    Number(b.data_evento < localDate()) ||
                  a.data_evento.localeCompare(b.data_evento),
              ),
          );
      } catch {
        if (live)
          setError("Não foi possível carregar os eventos e suas inscrições.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [aluno?.id, aluno?.organization_id, selected, revision]);
  const perform = async (
    event: any,
    action: "register" | "cancel" | "checkin",
  ) => {
    if (locked.current || !aluno) return;
    if (action === "cancel" && !confirm("Cancelar sua inscrição neste evento?"))
      return;
    locked.current = true;
    setBusy(true);
    try {
      const rpc = {
        register: "register_health_day",
        cancel: "cancel_health_day_registration",
        checkin: "checkin_health_day",
      }[action];
      const { data, error } = await (supabase as any).rpc(rpc, {
        p_event_id: event.id,
        p_aluno_id: aluno.id,
      });
      if (error) throw error;
      if (mounted.current) {
        toast.success(
          action === "register"
            ? data?.status === "lista_espera"
              ? "Você entrou na lista de espera."
              : "Inscrição confirmada."
            : action === "cancel"
              ? "Inscrição cancelada."
              : "Presença registrada.",
        );
        setRevision((v) => v + 1);
      }
    } catch (e) {
      if (mounted.current)
        toast.error((e as Error).message || "Falha ao atualizar inscrição.");
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <PersonaLayout title="Eventos">
      <div className="mx-auto max-w-3xl space-y-4">
        <p>
          Vaga confirmada e lista de espera são situações diferentes. A
          pré-inscrição pública é uma solicitação para verificação pela equipe.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            retry();
            setRevision((v) => v + 1);
          }}
        >
          Atualizar eventos
        </Button>
        {linking || loading ? (
          <p role="status">Carregando eventos…</p>
        ) : linkError || error ? (
          <p role="alert">{linkError || error}</p>
        ) : !aluno ? (
          <p>
            Confirme seu vínculo.{" "}
            <Link className="underline" to="/select-context">
              Selecionar condomínio
            </Link>
          </p>
        ) : !events.length ? (
          <p>Nenhum evento publicado.</p>
        ) : (
          events.map((event) => {
            const end = event.horario_fim || "23:59:59";
            const closed =
              new Date(event.data_evento + "T" + end + "-03:00") < new Date();
            const registered = [
              "confirmado",
              "lista_espera",
              "checkin",
            ].includes(event.registrationStatus);
            return (
              <Card
                key={event.id}
                className={selected === event.id ? "border-primary" : ""}
              >
                <CardContent className="space-y-3 p-5">
                  <h2 className="text-xl font-semibold">{event.nome}</h2>
                  <p>
                    {residentDate(event.data_evento)} ·{" "}
                    {event.horario_inicio?.slice(0, 5)} ·{" "}
                    {event.local || "Local a confirmar"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.descricao}
                  </p>
                  <p>
                    {closed
                      ? "Evento encerrado"
                      : event.vagas_totais + " vagas totais"}
                  </p>
                  <p className="font-medium">
                    {residentStatus[event.registrationStatus] ||
                      "Sem inscrição confirmada"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!closed &&
                      (!registered ? (
                        <Button
                          disabled={busy}
                          onClick={() => perform(event, "register")}
                        >
                          Inscrever-me
                        </Button>
                      ) : (
                        event.registrationStatus !== "checkin" && (
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => perform(event, "cancel")}
                          >
                            Cancelar inscrição
                          </Button>
                        )
                      ))}
                    {!closed &&
                      event.registrationStatus === "confirmado" &&
                      event.data_evento === localDate() && (
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => perform(event, "checkin")}
                        >
                          Registrar presença
                        </Button>
                      )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </PersonaLayout>
  );
}
