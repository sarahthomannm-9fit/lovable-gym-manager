import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const goals = [
  "Emagrecimento",
  "Ganho de massa",
  "Condicionamento",
  "Descompressão e saúde",
];
type EventInfo = {
  nome: string;
  data_evento: string;
  horario_inicio: string;
  organization_id: string;
};

export default function HealthDayEntry() {
  const { eventId } = useParams();
  return <EventEntry key={eventId} eventId={eventId} />;
}
function EventEntry({ eventId }: { eventId: string | undefined }) {
  const [event, setEvent] = useState<EventInfo | null>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    setEvent(undefined);
    setSent(false);
    setError("");
    if (!eventId || !/^[0-9a-f-]{36}$/i.test(eventId)) {
      setEvent(null);
      return;
    }
    void (supabase as any)
      .rpc("health_day_public_event", { p_event: eventId })
      .then(
        ({ data, error }: { data: EventInfo[] | null; error: unknown }) => {
          if (live) setEvent(error ? null : (data?.[0] ?? null));
        },
        () => {
          if (live) {
            setEvent(null);
            setError(
              "Não foi possível consultar o evento. Recarregue para tentar novamente.",
            );
          }
        },
      );
    return () => {
      live = false;
    };
  }, [eventId]);

  const submit = async (submission: FormEvent<HTMLFormElement>) => {
    submission.preventDefault();
    if (busy || !eventId) return;
    const fields = new FormData(submission.currentTarget);
    setBusy(true);
    setError("");
    try {
      const { error: failure } = await (supabase as any).rpc(
        "health_day_pre_register",
        {
          p_event: eventId,
          p_nome: fields.get("nome"),
          p_email: fields.get("email"),
          p_whatsapp: fields.get("whatsapp"),
          p_unidade: fields.get("unidade"),
          p_objetivo: fields.get("objetivo"),
        },
      );
      if (failure)
        setError(
          failure.message || "Não foi possível enviar. Tente novamente.",
        );
      else setSent(true);
    } catch {
      setError("Não foi possível enviar. Seus dados continuam no formulário.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <p className="text-sm font-medium text-primary">
            Nine Living · Health Day
          </p>
          <CardTitle>{event?.nome ?? "Pré-inscrição"}</CardTitle>
        </CardHeader>
        <CardContent>
          {event === undefined ? (
            <p role="status">Carregando evento…</p>
          ) : !event ? (
            <div>
              <p role={error ? "alert" : undefined}>
                {error || "Inscrições indisponíveis."}
              </p>
              {error && (
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente
                </Button>
              )}
            </div>
          ) : sent ? (
            <div className="space-y-3">
              <p role="status">
                Solicitação recebida. A equipe confirma seu vínculo e a
                disponibilidade da vaga.
              </p>
              <Button asChild variant="outline">
                <Link
                  to={
                    "/entrada?organization=" +
                    encodeURIComponent(event.organization_id) +
                    "&health_day=" +
                    encodeURIComponent(eventId ?? "")
                  }
                >
                  Acessar o app do condomínio
                </Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <p className="text-sm text-muted-foreground">
                {event.data_evento.split("-").reverse().join("/")} ·{" "}
                {event.horario_inicio.slice(0, 5)}
              </p>
              <label className="block">
                Nome
                <Input
                  name="nome"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                />
              </label>
              <label className="block">
                Apartamento
                <Input name="unidade" required maxLength={40} />
              </label>
              <label className="block">
                WhatsApp
                <Input
                  name="whatsapp"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={25}
                />
              </label>
              <label className="block">
                E-mail para vincular sua participação ao app
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </label>
              <label className="block">
                Objetivo
                <select
                  name="objetivo"
                  required
                  defaultValue=""
                  className="block w-full rounded-md border bg-background p-2"
                >
                  <option value="" disabled>
                    Selecione seu objetivo
                  </option>
                  {goals.map((goal) => (
                    <option key={goal}>{goal}</option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-muted-foreground">
                A equipe usará estes dados para organizar sua participação no
                evento.
              </p>
              {error && <p role="alert">{error}</p>}
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Enviando…" : "Solicitar vaga"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
