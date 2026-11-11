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
import { residentDate } from "@/lib/resident";
import { toast } from "sonner";
export default function Announcements() {
  const { activeOrg } = useOperationalContext();
  const [params, setParams] = useSearchParams();
  const selected =
    params.get("edit") || (params.get("new") === "1" ? "new" : null);
  const [rows, setRows] = useState<any[] | null>(null),
    [events, setEvents] = useState<any[]>([]),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [preview, setPreview] = useState<any>(null);
  const [form, setForm] = useState({ title: "", message: "", event: "" }),
    [initial, setInitial] = useState("");
  const initialized = useRef<string | null>(null);
  const mutation = useSyndicMutation(activeOrg?.id);
  const dirty = Boolean(
    selected && initial && initial !== JSON.stringify(form),
  );
  const allowNavigation = useResidentDraftGuard(
    dirty || mutation.pending || mutation.busy,
  );
  useEffect(() => {
    let live = true;
    setError("");
    void (async () => {
      try {
        if (!activeOrg) throw new Error("Selecione o condomínio.");
        const [a, e] = await Promise.all([
          (supabase as any).rpc("syndic_announcements", {
            p_org: activeOrg.id,
          }),
          (supabase as any).rpc("syndic_event_list", { p_org: activeOrg.id }),
        ]);
        if (a.error || e.error) throw a.error || e.error;
        if (live) {
          setRows(a.data || []);
          setEvents(e.data || []);
        }
      } catch (e) {
        if (live)
          setError(
            (e as Error).message || "Não foi possível consultar comunicados.",
          );
      }
    })();
    return () => {
      live = false;
    };
  }, [activeOrg?.id, revision]);
  useEffect(() => {
    if (!selected) {
      initialized.current = null;
      setPreview(null);
      return;
    }
    if (initialized.current === selected || rows === null) return;
    const source =
      selected === "new"
        ? { title: "", message: "", event: "" }
        : rows.find((r) => r.id === selected && r.status === "rascunho");
    if (!source) return;
    const value =
      selected === "new"
        ? source
        : {
            title: source.titulo,
            message: source.mensagem,
            event: source.event_id || "",
          };
    setForm(value);
    setInitial(JSON.stringify(value));
    initialized.current = selected;
  }, [selected, rows]);
  const patch = (value: Partial<typeof form>) =>
    setForm((old) => ({ ...old, ...value }));
  const save = () => {
    if (form.title.trim().length < 3 || form.message.trim().length < 3)
      return toast.error(
        "Informe título e mensagem com pelo menos três caracteres.",
      );
    void mutation.execute(
      "announcement",
      selected === "new" ? null : selected,
      {
        title: form.title.trim(),
        message: form.message.trim(),
        event: form.event || null,
      },
      (id) => {
        setInitial(JSON.stringify(form));
        allowNavigation();
        setRevision((v) => v + 1);
        setParams({ edit: id }, { replace: true });
        toast.success(
          "Rascunho confirmado. Confira o público antes de publicar.",
        );
      },
    );
  };
  return (
    <PersonaLayout title="Comunicação">
      {!activeOrg ? (
        <PersonaEmptyState />
      ) : (
        <div className="mx-auto max-w-3xl space-y-5">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold">
              Comunicados do condomínio
            </h1>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={mutation.busy || mutation.pending}
                onClick={() => {
                  if (dirty && !confirm("Descartar alterações desta edição?"))
                    return;
                  allowNavigation();
                  initialized.current = null;
                  setParams({ new: "1" });
                }}
              >
                Novo comunicado
              </Button>
              <Button
                variant="outline"
                onClick={() => setRevision((v) => v + 1)}
              >
                Atualizar lista
              </Button>
            </div>
          </header>
          <p className="text-sm text-muted-foreground">
            Rascunho, publicação no aplicativo e leitura são etapas diferentes.
            Esta tela não confirma envio por e-mail ou WhatsApp.
          </p>
          {(error || mutation.error) && (
            <div
              role="alert"
              className="space-y-2 rounded-lg border border-destructive p-4"
            >
              <p>{error || mutation.error}</p>
              {mutation.pending && (
                <Button
                  variant="outline"
                  disabled={mutation.busy}
                  onClick={() => void mutation.retry()}
                >
                  Repetir pedido pendente
                </Button>
              )}
            </div>
          )}
          {selected && (
            <section className="space-y-4 rounded-xl border p-5">
              <h2 className="text-xl font-semibold">
                {selected === "new" ? "Novo rascunho" : "Editar rascunho"}
              </h2>
              {initialized.current !== selected ? (
                <p role="status">
                  {rows === null
                    ? "Carregando rascunho…"
                    : "Rascunho não disponível. Atualize a lista ou inicie outro comunicado."}
                </p>
              ) : (
                <fieldset
                  disabled={mutation.busy || mutation.pending}
                  className="space-y-4"
                >
                  <label className="block text-sm">
                    Título
                    <Input
                      maxLength={200}
                      value={form.title}
                      onChange={(e) => patch({ title: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    Mensagem
                    <Textarea
                      rows={6}
                      maxLength={4000}
                      value={form.message}
                      onChange={(e) => patch({ message: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    Destinatários
                    <select
                      className="mt-1 min-h-11 w-full rounded border bg-background p-2"
                      value={form.event}
                      onChange={(e) => patch({ event: e.target.value })}
                    >
                      <option value="">Moradores ativos do condomínio</option>
                      {events.map((e) => (
                        <option key={e.id} value={e.id}>
                          Inscritos confirmados: {e.nome} ·{" "}
                          {residentDate(e.data_evento)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={save}>Salvar rascunho</Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (dirty && !confirm("Sair sem salvar as alterações?"))
                          return;
                        allowNavigation();
                        setParams({});
                      }}
                    >
                      Voltar à lista
                    </Button>
                  </div>
                </fieldset>
              )}
            </section>
          )}
          {preview && (
            <section className="space-y-4 rounded-xl border border-primary p-5">
              <h2 className="text-xl font-semibold">Conferir publicação</h2>
              <h3 className="font-semibold">{preview.titulo}</h3>
              <p className="whitespace-pre-wrap">{preview.mensagem}</p>
              <p className="text-sm font-medium">
                Público:{" "}
                {preview.publico === "evento"
                  ? "inscritos confirmados ou presentes no evento " +
                    (events.find((e) => e.id === preview.event_id)?.nome ||
                      "vinculado")
                  : "moradores ativos do condomínio"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={mutation.busy || mutation.pending}
                  onClick={() =>
                    void mutation.execute(
                      "publish_announcement",
                      preview.id,
                      {},
                      () => {
                        setPreview(null);
                        setRevision((v) => v + 1);
                        toast.success("Comunicado publicado no aplicativo.");
                      },
                    )
                  }
                >
                  Confirmar publicação no app
                </Button>
                <Button
                  variant="outline"
                  disabled={mutation.busy}
                  onClick={() => setPreview(null)}
                >
                  Voltar
                </Button>
              </div>
            </section>
          )}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Histórico</h2>
            {rows === null ? (
              !error && <p role="status">Carregando comunicados…</p>
            ) : !rows.length ? (
              <p>Nenhum comunicado registrado.</p>
            ) : (
              rows.map((row) => (
                <article
                  key={row.id}
                  className="space-y-3 rounded-xl border p-5"
                >
                  <h3 className="text-lg font-semibold">{row.titulo}</h3>
                  <p className="text-sm">
                    {row.status} · {residentDate(row.created_at, true)} ·{" "}
                    {row.publico === "evento"
                      ? "Público do evento vinculado"
                      : "Condomínio"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {row.reads} leitura(s) registradas · {row.app_notifications}{" "}
                    aviso(s) gerados no aplicativo. Publicação não comprova
                    leitura de todos.
                  </p>
                  <details>
                    <summary className="min-h-11 cursor-pointer py-2">
                      Ver mensagem
                    </summary>
                    <p className="whitespace-pre-wrap text-sm">
                      {row.mensagem}
                    </p>
                  </details>
                  <div className="flex flex-wrap gap-2">
                    {row.status === "rascunho" && (
                      <>
                        <Button
                          variant="outline"
                          disabled={mutation.busy || mutation.pending}
                          onClick={() => {
                            if (
                              dirty &&
                              !confirm("Descartar alterações desta edição?")
                            )
                              return;
                            allowNavigation();
                            initialized.current = null;
                            setParams({ edit: row.id });
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          disabled={mutation.busy || mutation.pending}
                          onClick={() => setPreview(row)}
                        >
                          Conferir e publicar
                        </Button>
                      </>
                    )}
                    {row.status !== "arquivado" && (
                      <Button
                        variant="ghost"
                        disabled={mutation.busy || mutation.pending}
                        onClick={() => {
                          if (
                            confirm(
                              "Arquivar este comunicado? Ele sairá da lista ativa do aplicativo.",
                            )
                          )
                            void mutation.execute(
                              "archive_announcement",
                              row.id,
                              {},
                              () => {
                                setRevision((v) => v + 1);
                                toast.success("Comunicado arquivado.");
                              },
                            );
                        }}
                      >
                        Arquivar
                      </Button>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      )}
    </PersonaLayout>
  );
}
