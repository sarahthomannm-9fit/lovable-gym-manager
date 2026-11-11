import { useResidentDraftGuard } from "@/hooks/useResidentDraftGuard";
import { PAR_Q_QUESTIONS } from "@/lib/parq";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOperationalContext } from "@/hooks/useOperationalContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const pendingTriageKey = (studentId: string) =>
  "nine:pending-triage:" + studentId;

const goals = [
  "Hipertrofia",
  "Emagrecimento",
  "Postural e mobilidade",
  "Cardio",
  "Força",
  "Funcional",
];

export default function OnboardingMorador() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  return (
    <ResidentIntake key={user?.id + ":" + (params.get("organization") || "")} />
  );
}
function ResidentIntake() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refresh } = useOperationalContext();
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState("");
  const [step, setStep] = useState(1);
  const [alunoId, setAlunoId] = useState("");
  const [organizations, setOrganizations] = useState<
    { id: string; nome: string }[]
  >([]);
  const [organizationId, setOrganizationId] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingTriage, setPendingTriage] = useState<string | null>(null);
  const [medications, setMedications] = useState("");
  const [level, setLevel] = useState("iniciante");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const requestId = useRef<string>(crypto.randomUUID());
  const locked = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const parqComplete = PAR_Q_QUESTIONS.every((_, index) =>
    Boolean(answers[index]),
  );
  const [form, setForm] = useState({
    consentimento: false,
    restricoes: "",
    lesoes: "",
    historico: "",
    cirurgias: "",
    dor: false,
    sinais: "",
    observacoes: "",
    objetivo: "",
  });

  useResidentDraftGuard(form.consentimento && !pendingTriage);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data: identity, error: identityError } =
          await supabase.auth.getUser();
        if (identityError || !identity.user)
          throw new Error("Entre novamente para continuar.");
        let pending: any = identity.user.user_metadata?.resident_entry || {};
        try {
          const saved = JSON.parse(
            localStorage.getItem("nine:resident-entry") || "null",
          );
          if (saved?.email === identity.user.email?.toLowerCase())
            pending = saved;
        } catch {
          /* optional local draft */
        }
        const orgId = params.get("organization") || pending.organization_id;
        let query = supabase
          .from("alunos")
          .select("id, organization_id")
          .eq("user_id", identity.user.id);
        if (orgId) query = query.eq("organization_id", orgId);
        const { data: existing, error: lookupError } =
          await query.maybeSingle();
        if (lookupError) throw lookupError;
        let student = existing;
        if (!student && orgId) {
          const { data: id, error } = await (supabase as any).rpc(
            "start_resident_onboarding",
            {
              p_organization_id: orgId,
              p_nome:
                pending.nome ||
                identity.user.user_metadata?.nome ||
                identity.user.email?.split("@")[0],
              p_email: identity.user.email,
              p_unidade: pending.unidade || "",
            },
          );
          if (error) throw error;
          student = { id, organization_id: orgId };
        }
        if (!student?.organization_id)
          throw new Error(
            "Inicie seu cadastro pela página de entrada ou aceite o convite do condomínio.",
          );
        const { data: org } = await supabase
          .from("organizations")
          .select("id,nome")
          .eq("id", student.organization_id)
          .single();
        if (live) {
          const key =
            "nine:intake-request:" + identity.user.id + ":" + student.id;
          try {
            const previous = sessionStorage.getItem(key);
            requestId.current =
              previous &&
              /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(previous)
                ? previous
                : crypto.randomUUID();
            sessionStorage.setItem(key, requestId.current);
          } catch {
            /* Request remains stable in this tab. */
          }
          setAlunoId(student.id);
          setOrganizationId(student.organization_id);
          setOrganizations(org ? [org] : []);
          try {
            setPendingTriage(
              sessionStorage.getItem(pendingTriageKey(student.id)),
            );
          } catch {
            /* Optional retry state. */
          }
        }
        const previousRequest = await supabase
          .from("anamnese_respostas")
          .select("id")
          .eq("id", requestId.current)
          .eq("aluno_id", student.id)
          .maybeSingle();
        if (previousRequest.error) throw previousRequest.error;
        if (live && previousRequest.data)
          setPendingTriage(previousRequest.data.id);
        if (params.get("resume") === "1") {
          const { data: saved, error } = await supabase
            .from("anamnese_respostas")
            .select("id")
            .eq("aluno_id", student.id)
            .eq("status", "preenchido")
            .eq("respostas->>triagem_portaria", "true")
            .order("preenchido_em", { ascending: false, nullsFirst: false })
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (error) throw error;
          if (live && saved) setPendingTriage(saved.id);
        }
        try {
          localStorage.removeItem("nine:resident-entry");
        } catch {
          /* Optional entry hint. */
        }
      } catch (e) {
        if (live)
          setInitError((e as Error).message || "Falha ao carregar cadastro.");
      } finally {
        if (live) setInitializing(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const finishTriage = async (id: string) => {
    const { error } = await supabase.functions.invoke("triagem-decidir", {
      body: { anamnese_id: id },
    });
    if (error) {
      toast.error("Respostas salvas. Tente concluir o envio novamente.");
      return;
    }
    try {
      sessionStorage.removeItem(pendingTriageKey(alunoId));
    } catch {
      /* Optional retry state. */
    }
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user)
        sessionStorage.removeItem(
          "nine:intake-request:" + data.user.id + ":" + alunoId,
        );
    } catch {
      /* Optional retry state. */
    }
    await refresh();
    toast.success("Triagem enviada para a equipe do condomínio.");
    navigate("/morador");
  };

  const submitObjective = async () => {
    if (
      locked.current ||
      saving ||
      (!pendingTriage && (!form.objetivo || !parqComplete))
    )
      return;
    locked.current = true;
    setSaving(true);
    try {
      if (pendingTriage) {
        await finishTriage(pendingTriage);
        return;
      }
      if (!form.consentimento || !alunoId || !organizationId)
        throw new Error("Confirme a triagem antes de enviar.");
      const payload = {
        consentimento: form.consentimento,
        consent_version: "triagem-2026-10-26-v1",
        restricoes: form.restricoes
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        lesoes_atuais: form.lesoes
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        historico_lesoes: form.historico,
        cirurgias: form.cirurgias,
        dor_atual: form.dor,
        sinais_alerta: form.sinais
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        observacoes: form.observacoes,
        objetivo: form.objetivo,
      };
      const previous = await supabase
        .from("anamnese_respostas")
        .select("id")
        .eq("id", requestId.current)
        .eq("aluno_id", alunoId)
        .maybeSingle();
      if (previous.error) throw previous.error;
      if (previous.data) {
        setPendingTriage(previous.data.id);
        toast.info(
          "O envio anterior já foi salvo. Vamos concluir esse envio; para corrigir as respostas, solicite reavaliação à equipe.",
        );
        await finishTriage(previous.data.id);
        return;
      }
      const { data: anamneseId, error } = await supabase.rpc(
        "submit_resident_portaria",
        {
          p_aluno_id: alunoId,
          p_organization_id: organizationId,
          p_request_id: requestId.current,
          p_payload: {
            ...payload,
            medicamentos: medications,
            nivel: level,
            par_q: PAR_Q_QUESTIONS.map((pergunta, index) => ({
              pergunta,
              resposta: answers[index],
            })),
          },
        },
      );
      if (error) return toast.error(error.message);
      if (!anamneseId) throw new Error("Triagem indisponível");
      setPendingTriage(anamneseId);
      try {
        sessionStorage.setItem(pendingTriageKey(alunoId), anamneseId);
      } catch {
        /* Optional retry state. */
      }
      await finishTriage(anamneseId);
    } catch {
      toast.error("Falha ao enviar. Suas respostas continuam nesta tela.");
    } finally {
      locked.current = false;
      setSaving(false);
    }
  };

  if (pendingTriage)
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Respostas salvas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Conclua o envio para a equipe do condomínio avaliar sua triagem.
            </p>
            <Button disabled={saving} onClick={submitObjective}>
              {saving ? "Enviando…" : "Concluir envio"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  if (initializing)
    return (
      <div className="p-8" role="status">
        Confirmando seu cadastro…
      </div>
    );
  if (initError)
    return (
      <div className="p-8 space-y-4" role="alert">
        <p>{initError}</p>
        <Button onClick={() => navigate("/entrada")}>Voltar à entrada</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  if (!initializing && !initError && !form.consentimento)
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>Antes da sua triagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Vamos solicitar restrições, lesões, cirurgias, dor e seu objetivo
              para orientar a avaliação e o treino. As respostas ficam
              disponíveis para você e para profissionais autorizados do seu
              condomínio. O painel do síndico não recebe sua anamnese.
            </p>
            <p className="text-sm text-muted-foreground">
              Consentimento: triagem-2026-10-26-v1. Você pode procurar o suporte
              para solicitar acesso ou correção dos seus dados.
            </p>
            <label className="flex gap-3">
              <Checkbox
                checked={false}
                onCheckedChange={(value) => {
                  if (value === true) setForm({ ...form, consentimento: true });
                }}
              />
              <span>
                Li a finalidade e autorizo o uso das respostas para minha
                avaliação e meu treinamento.
              </span>
            </label>
          </CardContent>
        </Card>
      </div>
    );
  const questionIndex = step - 2;
  const titles =
    step === 1
      ? "Qual é seu objetivo?"
      : step <= 8
        ? "Prontidão para atividade física"
        : step === 9
          ? "Informações para a equipe"
          : step === 10
            ? "Sua experiência e medicamentos"
            : "Confira antes de enviar";
  const canContinue =
    step === 1
      ? Boolean(form.objetivo)
      : step <= 8
        ? Boolean(answers[questionIndex])
        : true;
  const clearConsent = () => {
    if (
      !confirm(
        "Retirar o consentimento e limpar as respostas ainda não enviadas?",
      )
    )
      return;
    setForm({
      consentimento: false,
      restricoes: "",
      lesoes: "",
      historico: "",
      cirurgias: "",
      dor: false,
      sinais: "",
      observacoes: "",
      objetivo: "",
    });
    setMedications("");
    setAnswers({});
    setLevel("iniciante");
    setStep(1);
  };
  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-xl space-y-5">
        <header>
          <p className="text-sm text-primary">
            NINE LIVING · {organizations[0]?.nome}
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            Vamos preparar seu treino
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Etapa {step} de 11. Suas respostas só serão enviadas na confirmação
            final. Elas ficam nesta tela enquanto você avança ou volta.
          </p>
        </header>
        <progress
          aria-label="Progresso da triagem"
          className="h-2 w-full"
          max={11}
          value={step}
        />
        <Card>
          <CardHeader>
            <h2
              ref={heading}
              tabIndex={-1}
              className="text-xl font-semibold outline-none"
            >
              {titles}
            </h2>
          </CardHeader>
          <CardContent className="space-y-5">
            {step === 1 && (
              <fieldset className="space-y-3">
                <legend className="sr-only">Objetivo do treino</legend>
                {goals.map((goal) => (
                  <label
                    key={goal}
                    className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border p-4"
                  >
                    <input
                      type="radio"
                      name="goal"
                      checked={form.objetivo === goal}
                      onChange={() => setForm({ ...form, objetivo: goal })}
                    />
                    {goal}
                  </label>
                ))}
              </fieldset>
            )}
            {step >= 2 && step <= 8 && (
              <fieldset className="space-y-4">
                <legend className="text-lg">
                  {PAR_Q_QUESTIONS[questionIndex]}
                </legend>
                <RadioGroup
                  value={answers[questionIndex] || ""}
                  onValueChange={(value) =>
                    setAnswers((old) => ({ ...old, [questionIndex]: value }))
                  }
                >
                  {[
                    ["sim", "Sim"],
                    ["nao", "Não"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className="flex min-h-12 items-center gap-3 rounded-lg border p-4"
                    >
                      <RadioGroupItem value={value} />
                      {label}
                    </label>
                  ))}
                </RadioGroup>
                <p className="text-sm text-muted-foreground">
                  Responda conforme sua situação. A equipe avaliará as respostas
                  antes de liberar o treino.
                </p>
              </fieldset>
            )}
            {step === 9 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Campos opcionais. Informe o que a equipe precisa conhecer; se
                  não se aplica, deixe em branco.
                </p>
                {(
                  [
                    ["restricoes", "Restrições médicas"],
                    ["lesoes", "Lesões atuais"],
                    ["historico", "Histórico de lesões"],
                    ["cirurgias", "Cirurgias e recomendações profissionais"],
                    ["sinais", "Sinais de alerta"],
                    ["observacoes", "Observações adicionais"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block text-sm">
                    {label}
                    <Textarea
                      className="mt-1"
                      maxLength={4000}
                      value={form[key]}
                      onChange={(event) =>
                        setForm({ ...form, [key]: event.target.value })
                      }
                    />
                  </label>
                ))}
                <label className="flex min-h-12 items-center gap-3">
                  <Checkbox
                    checked={form.dor}
                    onCheckedChange={(value) =>
                      setForm({ ...form, dor: value === true })
                    }
                  />
                  Sinto dor ou desconforto atualmente
                </label>
              </>
            )}
            {step === 10 && (
              <>
                <label className="block text-sm">
                  Medicamentos em uso (opcional)
                  <Textarea
                    className="mt-1"
                    maxLength={4000}
                    value={medications}
                    onChange={(event) => setMedications(event.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  Experiência com treino
                  <select
                    className="mt-1 block min-h-12 w-full rounded-md border bg-background p-3"
                    value={level}
                    onChange={(event) => setLevel(event.target.value)}
                  >
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediário">Intermediário</option>
                    <option value="avançado">Avançado</option>
                  </select>
                </label>
              </>
            )}
            {step === 11 && (
              <div className="space-y-4">
                <p>
                  <strong>Objetivo:</strong> {form.objetivo}
                </p>
                <p>
                  <strong>Experiência:</strong> {level}
                </p>
                <ul className="space-y-2">
                  {PAR_Q_QUESTIONS.map((q, index) => (
                    <li key={q} className="text-sm">
                      {q}{" "}
                      <strong>
                        {answers[index] === "sim" ? "Sim" : "Não"}
                      </strong>
                    </li>
                  ))}
                </ul>
                <dl className="space-y-2">
                  {Object.entries({
                    Restrições: form.restricoes,
                    Lesões: form.lesoes,
                    Histórico: form.historico,
                    Cirurgias: form.cirurgias,
                    "Sinais de alerta": form.sinais,
                    Observações: form.observacoes,
                    Medicamentos: medications,
                    Dor: form.dor ? "Sim" : "Não",
                  }).map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-sm font-medium">{label}</dt>
                      <dd className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {value || "Não informado"}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="text-sm">
                  Ao enviar, confirmo as respostas e o consentimento
                  apresentado. A liberação depende da avaliação da equipe; este
                  envio não publica um treino automaticamente.
                </p>
              </div>
            )}
            <div className="flex flex-wrap justify-between gap-3">
              <Button
                variant="outline"
                disabled={saving || step === 1}
                onClick={() => setStep((value) => value - 1)}
              >
                Voltar
              </Button>
              {step < 11 ? (
                <Button
                  disabled={!canContinue || saving}
                  onClick={() => setStep((value) => value + 1)}
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  disabled={saving || !parqComplete || !form.objetivo}
                  onClick={submitObjective}
                >
                  {saving ? "Enviando…" : "Confirmar e enviar triagem"}
                </Button>
              )}
            </div>
            <Button variant="ghost" disabled={saving} onClick={clearConsent}>
              Retirar consentimento antes do envio
            </Button>
            <p className="text-xs text-muted-foreground">
              Após o envio, solicite correção ou reavaliação à equipe. Avisos
              opcionais e comunicação comercial têm finalidades diferentes deste
              consentimento.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
