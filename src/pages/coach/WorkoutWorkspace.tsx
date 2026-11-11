import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOperationalContext } from "@/hooks/useOperationalContext";
import { PersonaLayout } from "@/layouts/PersonaLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CriarTreinoDialog } from "@/components/CriarTreinoDialog";
export default function WorkoutWorkspace() {
  const { activeOrg } = useOperationalContext();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const student = params.get("student"),
    workout = params.get("workout"),
    queue = params.get("queue"),
    protocol = params.get("protocol");
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [published, setPublished] = useState(false);
  const requested = params.get("return");
  const destination =
    requested && requested.startsWith("/coach?")
      ? requested
      : "/coach?student=" + encodeURIComponent(student || "");
  useEffect(() => {
    let live = true;
    setData(null);
    setError("");
    void (async () => {
      try {
        if (!student || !activeOrg)
          throw new Error(
            "Selecione o condomínio e o morador antes de montar o treino.",
          );
        const { data, error } = await (supabase as any).rpc(
          "coach_student_case",
          { p_student: student },
        );
        if (error || data?.student?.organization_id !== activeOrg.id)
          throw error || new Error("Morador indisponível.");
        if (queue && data.queue?.id !== queue)
          throw new Error(
            "Esta triagem não é a captura atual. Atualize o atendimento.",
          );
        if (workout && !data.workouts.some((w: any) => w.id === workout))
          throw new Error("Plano de origem fora deste atendimento.");
        if (live) setData(data);
      } catch (e) {
        if (live)
          setError((e as Error).message || "Não foi possível abrir o editor.");
      }
    })();
    return () => {
      live = false;
    };
  }, [student, workout, queue, activeOrg?.id, revision]);
  const template =
    params.get("manual") === "1"
      ? null
      : protocol ||
        (!workout && queue
          ? data?.queue?.sugestao?.protocol_template_id
          : null);
  return (
    <PersonaLayout title="Prescrição do morador">
      {published ? (
        <section className="mx-auto max-w-xl space-y-4 rounded-xl border p-6">
          <h1 className="text-2xl font-semibold">Publicação confirmada</h1>
          <p>
            O plano de {data.student.nome} está registrado no aplicativo. Isso
            não confirma leitura pelo morador.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/coach?student=" + student)}>
              Ver plano publicado
            </Button>
            <Button variant="outline" onClick={() => navigate(destination)}>
              Voltar aos atendimentos
            </Button>
          </div>
        </section>
      ) : error ? (
        <div role="alert" className="space-y-3">
          <p>{error}</p>
          <Button onClick={() => setRevision((v) => v + 1)}>
            Tentar novamente
          </Button>
          <Button variant="outline" onClick={() => navigate(destination)}>
            Voltar ao atendimento
          </Button>
        </div>
      ) : !data ? (
        <p role="status">Confirmando morador e origem da prescrição…</p>
      ) : (
        <CriarTreinoDialog
          key={[activeOrg.id, student, workout, queue, template].join(":")}
          embedded
          organizationId={activeOrg.id}
          alunos={[data.student]}
          initialAlunoId={student}
          initialWorkoutId={workout || undefined}
          queueId={queue || undefined}
          initialProtocolId={template || undefined}
          protocolAdjustments={
            queue ? data.queue?.sugestao?.ajustes : undefined
          }
          onClose={() => navigate(destination)}
          onCriado={() => setPublished(true)}
        />
      )}
    </PersonaLayout>
  );
}
