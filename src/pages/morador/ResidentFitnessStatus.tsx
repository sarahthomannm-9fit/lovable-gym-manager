import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
const messages: Record<string, string> = {
  cadastro:
    "Seu cadastro precisa de liberação pela administração do condomínio.",
  preencher: "Preencha a triagem para o professor preparar seu treino.",
  processando: "Suas respostas foram salvas. Conclua o envio para a equipe.",
  avaliacao:
    "Sua triagem precisa de avaliação profissional antes de liberar o treino.",
  publicacao: "Aguardando a publicação do treino pelo professor.",
};
export function ResidentFitnessStatus({
  studentId,
  organizationId,
  fallback,
  onRefresh,
}: {
  studentId: string;
  organizationId: string;
  fallback: string;
  onRefresh?: () => void;
}) {
  const [status, setStatus] = useState<string | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setStatus(null);
    void (async () => {
      try {
        const { data, error } = await supabase.rpc("resident_fitness_status", {
          p_aluno: studentId,
        });
        if (error || !data) throw error || new Error();
        if (active) setStatus(data);
      } catch {
        if (active) setError("Não foi possível consultar sua triagem.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [studentId, revision]);
  return (
    <div className="space-y-3">
      <p
        role={error ? "alert" : loading ? "status" : undefined}
        className="text-sm text-muted-foreground"
      >
        {loading
          ? "Consultando sua situação…"
          : error || (status && messages[status]) || fallback}
      </p>
      {!loading &&
        !error &&
        (status === "preencher" || status === "processando") && (
          <Button asChild>
            <Link
              to={
                "/morador/onboarding?organization=" +
                encodeURIComponent(organizationId) +
                (status === "processando" ? "&resume=1" : "")
              }
            >
              {status === "preencher" ? "Preencher triagem" : "Concluir envio"}
            </Link>
          </Button>
        )}
      {!loading && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setRevision((v) => v + 1);
              onRefresh?.();
            }}
          >
            Atualizar situação
          </Button>
          {status !== "preencher" && (
            <Button variant="ghost" asChild>
              <Link to="/morador?tab=suporte">Pedir orientação à equipe</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
