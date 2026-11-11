import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { operationId, completeOperation } from "@/lib/operations";
type Attempt = {
  id: string;
  key?: string;
  kind: string;
  target: string | null;
  payload: Record<string, unknown>;
  done?: (id: string) => void;
};
export function useSyndicMutation(orgId: string | undefined) {
  const { user } = useAuth();
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const lock = useRef(false),
    attempt = useRef<Attempt | null>(null);
  const [busy, setBusy] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const send = async (a: Attempt) => {
    if (lock.current || !orgId) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const { data, error } = await (supabase as any).rpc(
        "syndic_save_operation",
        {
          p_request: a.id,
          p_org: orgId,
          p_kind: a.kind,
          p_target: a.target,
          p_payload: a.payload,
        },
      );
      if (error || !data) throw error || new Error("Resposta indisponível");
      attempt.current = null;
      if (live.current) setPending(false);
      if (a.key)
        try {
          completeOperation(a.key);
        } catch {
          /* Server confirmed. */
        }
      if (!live.current) return;
      try {
        await a.done?.(data);
      } catch {
        setError(
          "Registro confirmado. Atualize a lista para consultar o resultado.",
        );
      }
    } catch (failure) {
      if (!live.current) return;
      const code = (failure as { code?: string }).code;
      if (code && /^[0-9A-Z]{5}$/.test(code)) {
        attempt.current = null;
        setPending(false);
        setError((failure as Error).message || "Operação recusada.");
      } else {
        attempt.current = a;
        setPending(true);
        setError(
          "Resultado ainda não confirmado. Repita o mesmo pedido antes de iniciar outro.",
        );
      }
    } finally {
      lock.current = false;
      if (live.current) setBusy(false);
    }
  };
  const execute = async (
    kind: string,
    target: string | null,
    payload: Record<string, unknown>,
    done?: (id: string) => void,
  ) => {
    if (lock.current || attempt.current || !orgId || !user) return;
    lock.current = true;
    let identity: { id: string; key?: string };
    try {
      identity = await operationId(
        kind + ":" + (target || "new"),
        user.id + ":" + orgId,
        payload,
      );
    } catch {
      identity = { id: crypto.randomUUID() };
    }
    if (!live.current) {
      lock.current = false;
      return;
    }
    const a = { ...identity, kind, target, payload, done };
    attempt.current = a;
    lock.current = false;
    await send(a);
  };
  return {
    execute,
    busy,
    pending,
    error,
    retry: () => attempt.current && send(attempt.current),
  };
}
