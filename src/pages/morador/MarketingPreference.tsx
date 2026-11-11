import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function MarketingPreference({ studentId }: { studentId: string }) {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const locked = useRef(false);
  useEffect(() => {
    let live = true;
    setSaved(null);
    setError("");
    void (async () => {
      try {
        const { data, error } = await supabase.rpc(
          "resident_marketing_preference",
          { p_aluno: studentId },
        );
        const preference = data as { subscribed?: boolean } | null;
        if (error || typeof preference?.subscribed !== "boolean")
          throw error || new Error();
        if (live) {
          setSaved(preference.subscribed);
          setEnabled(preference.subscribed);
        }
      } catch {
        if (live)
          setError("Não foi possível consultar sua preferência comercial.");
      }
    })();
    return () => {
      live = false;
    };
  }, [studentId, revision]);
  const save = async () => {
    if (locked.current || saved === null) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const { data, error } = await supabase.rpc(
        "set_resident_marketing_preference",
        { p_aluno: studentId, p_enabled: enabled },
      );
      const preference = data as { subscribed?: boolean } | null;
      if (error || typeof preference?.subscribed !== "boolean")
        throw error || new Error();
      setSaved(preference.subscribed);
      setEnabled(preference.subscribed);
      toast.success("Preferência comercial atualizada.");
    } catch {
      setError(
        "Não foi possível confirmar a alteração. Consulte novamente ou repita o salvamento.",
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return (
    <section className="space-y-3 rounded-lg border p-4">
      <h2 className="font-medium">Comunicação comercial por e-mail</h2>
      <p className="text-sm text-muted-foreground">
        Ofertas e novidades do seu condomínio. Esta escolha é opcional e não
        altera seu acesso ao treino, sua triagem ou os avisos do aplicativo.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {saved === null ? (
        error ? (
          <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Tentar novamente
          </Button>
        ) : (
          <p role="status">Consultando preferência…</p>
        )
      ) : (
        <>
          <label className="flex min-h-12 items-center gap-3 text-sm">
            <Checkbox
              checked={enabled}
              disabled={busy}
              onCheckedChange={(value) => setEnabled(value === true)}
            />
            Quero receber ofertas e novidades por e-mail
          </label>
          <p className="text-sm text-muted-foreground">
            Preferência salva:{" "}
            {saved
              ? "receber comunicação comercial"
              : "não receber comunicação comercial"}
            .
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={busy || enabled === saved}
              onClick={save}
            >
              {busy ? "Salvando…" : "Salvar preferência comercial"}
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setRevision((v) => v + 1)}
            >
              Consultar novamente
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
