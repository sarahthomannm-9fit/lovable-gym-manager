import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Entry = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  unidade: string;
};
type PendingReception = { id: string; checkin: boolean; source?: "confirmed" };
type Confirmed = {
  aluno_id: string;
  alunos?: { nome?: string; email?: string };
};

function readPending(key: string): PendingReception[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "null");
    const queue = Array.isArray(value) ? value : [value];
    return queue.filter(
      (item) =>
        typeof item?.id === "string" &&
        typeof item.checkin === "boolean" &&
        (item.source === undefined || item.source === "confirmed"),
    );
  } catch {
    return [];
  }
}

export function HealthDayReception({
  eventId,
  confirmed,
  onChange,
}: {
  eventId: string;
  confirmed: Confirmed[];
  onChange: () => void;
}) {
  const { user } = useAuth();
  const pendingKey = "nine:reception:" + user?.id + ":" + eventId;
  const [pending, setPending] = useState<PendingReception[]>([]);
  const inFlight = useRef(false);
  useEffect(() => {
    setPending(readPending(pendingKey));
  }, [pendingKey]);

  const storePending = (queue: PendingReception[]) => {
    setPending(queue);
    try {
      if (queue.length)
        sessionStorage.setItem(pendingKey, JSON.stringify(queue));
      else sessionStorage.removeItem(pendingKey);
    } catch {
      /* Keep the retry available while this screen stays open. */
    }
  };

  const [rows, setRows] = useState<Entry[] | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    void (supabase as any)
      .from("health_day_preinscricoes")
      .select("id,nome,email,whatsapp,unidade")
      .eq("evento_id", eventId)
      .is("aluno_id", null)
      .order("created_at")
      .then(
        ({ data, error }: { data: Entry[] | null; error: unknown }) => {
          if (!live) return;
          setFailed(Boolean(error));
          if (!error) setRows(data);
        },
        () => {
          if (live) setFailed(true);
        },
      );
    return () => {
      live = false;
    };
  }, [eventId, revision]);

  const sendPending = async (queue: PendingReception[]) => {
    if (inFlight.current || !user) return;
    inFlight.current = true;
    setBusy(true);
    let changed = false;
    try {
      for (const [index, request] of queue.entries()) {
        const { data, error, status } = await (supabase as any).rpc(
          "health_day_reception",
          {
            p_event: eventId,
            p_preinscricao: request.source === "confirmed" ? null : request.id,
            p_aluno: request.source === "confirmed" ? request.id : null,
            p_checkin: request.checkin,
          },
        );
        if (
          error ||
          !["checkin", "lista_espera", "confirmado"].includes(data)
        ) {
          if (
            !error?.code ||
            status < 400 ||
            status >= 500 ||
            [408, 429].includes(status)
          ) {
            toast.error(
              "Sem confirmação do servidor. As tentativas restantes foram preservadas.",
            );
            return;
          }
          toast.error(error.message);
        } else {
          toast.success(
            data === "checkin"
              ? "Presença registrada."
              : data === "lista_espera"
                ? "Encaminhado à lista de espera."
                : "Vaga confirmada.",
          );
        }
        storePending(queue.slice(index + 1));
        changed = true;
      }
    } catch {
      toast.error(
        "Sem confirmação do servidor. As tentativas restantes foram preservadas.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
      if (changed) {
        setRevision((value) => value + 1);
        onChange();
      }
    }
  };

  const receive = (request: PendingReception) => {
    if (
      inFlight.current ||
      !user ||
      pending.some(
        (item) => item.id === request.id && item.source === request.source,
      )
    )
      return;
    const queue = [...pending, request];
    storePending(queue);
    if (pending.length === 0 && navigator.onLine) void sendPending(queue);
  };

  const term = search.trim().toLowerCase();
  const matches = rows?.filter((row) =>
    [row.nome, row.email, row.unidade, row.whatsapp].some((value) =>
      value.toLowerCase().includes(term),
    ),
  );
  const confirmedMatches = confirmed.filter((row) =>
    [row.alunos?.nome, row.alunos?.email].some((value) =>
      value?.toLowerCase().includes(term),
    ),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recepção do Health Day</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Tentativas sem confirmação ficam nesta aba para reenvio. Não é
          operação totalmente offline; carregar listas e confirmar vagas exige
          conexão.
        </p>
        <p className="text-sm text-muted-foreground">
          Confirme com a administração que a pessoa mora na unidade antes de
          reservar vaga ou marcar presença.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={"/health-day/" + eventId} target="_blank" rel="noreferrer">
              Abrir cadastro expresso
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={() => setRevision((value) => value + 1)}
          >
            Atualizar lista
          </Button>
        </div>
        {pending.length > 0 && (
          <div className="space-y-2 rounded border p-3">
            <p role="status">
              {pending.length} tentativa(s) aguardando confirmação do servidor.
            </p>
            <ol className="list-decimal pl-5">
              {pending.map((request) => (
                <li key={(request.source ?? "pre") + request.id}>
                  {request.source === "confirmed"
                    ? (confirmed.find((row) => row.aluno_id === request.id)
                        ?.alunos?.nome ??
                      "Participante " + request.id.slice(0, 8))
                    : (rows?.find((row) => row.id === request.id)?.nome ??
                      "Pré-inscrição " + request.id.slice(0, 8))}
                  {" · "}
                  {request.checkin ? "Check-in" : "Reserva"}
                </li>
              ))}
            </ol>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void sendPending(pending)}
            >
              Reenviar fila
            </Button>
          </div>
        )}
        <Input
          aria-label="Buscar na recepção"
          placeholder="Buscar por nome, e-mail, apartamento ou telefone"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {failed && (
          <p role="alert">
            Não foi possível atualizar a lista. As pré-inscrições já carregadas
            continuam visíveis.
          </p>
        )}
        {!matches ? (
          !failed && <p role="status">Carregando…</p>
        ) : matches.length === 0 ? (
          <p>Nenhuma pré-inscrição pendente.</p>
        ) : (
          <ul className="divide-y">
            {matches.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap justify-between gap-2 py-2"
              >
                <div>
                  <p className="font-medium">
                    {entry.nome} · {entry.unidade}
                  </p>
                  <p className="text-sm">
                    {entry.email} · {entry.whatsapp}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      busy ||
                      pending.some(
                        (request) =>
                          request.source === undefined &&
                          request.id === entry.id,
                      )
                    }
                    onClick={() =>
                      void receive({ id: entry.id, checkin: false })
                    }
                  >
                    Vínculo verificado · Reservar
                  </Button>
                  <Button
                    size="sm"
                    disabled={
                      busy ||
                      pending.some(
                        (request) =>
                          request.source === undefined &&
                          request.id === entry.id,
                      )
                    }
                    onClick={() =>
                      void receive({ id: entry.id, checkin: true })
                    }
                  >
                    Vínculo verificado · Check-in
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {confirmedMatches.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-medium">
              Vagas confirmadas · Aguardando presença
            </h3>
            <ul className="divide-y">
              {confirmedMatches.map((row) => (
                <li
                  key={row.aluno_id}
                  className="flex flex-wrap justify-between gap-2 py-2"
                >
                  <div>
                    <p className="font-medium">
                      {row.alunos?.nome ?? "Morador"}
                    </p>
                    <p className="text-sm">{row.alunos?.email}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={
                      busy ||
                      pending.some(
                        (item) =>
                          item.source === "confirmed" &&
                          item.id === row.aluno_id,
                      )
                    }
                    onClick={() =>
                      receive({
                        id: row.aluno_id,
                        checkin: true,
                        source: "confirmed",
                      })
                    }
                  >
                    Registrar presença
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
