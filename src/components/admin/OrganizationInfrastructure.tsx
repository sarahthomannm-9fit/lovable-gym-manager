import { FitnessInfrastructure } from "@/components/FitnessInfrastructure";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const emptyFacility = () => ({
  ambiente: "Academia",
  nome: "",
  categoria: "",
  quantidade: "1",
  foto_path: "",
  observacoes: "",
  leitura: "",
});

type InfrastructureDraft = {
  id: string;
  step: number;
  facility: ReturnType<typeof emptyFacility>;
};
function readInfrastructureDraft(key: string): InfrastructureDraft {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    if (
      saved &&
      /^[0-9a-f-]{36}$/i.test(saved.id) &&
      Number.isInteger(saved.step) &&
      saved.step >= 0 &&
      saved.step < 7 &&
      Object.keys(emptyFacility()).every(
        (field) => typeof saved.facility?.[field] === "string",
      )
    )
      return saved;
  } catch {
    /* Start with a clean form if a local draft is malformed. */
  }
  return { id: crypto.randomUUID(), step: 0, facility: emptyFacility() };
}

export function OrganizationInfrastructure({
  orgId,
  guided = false,
}: {
  orgId: string;
  guided?: boolean;
}) {
  const { user } = useAuth();
  const draftKey = "nine:infrastructure:" + user?.id + ":" + orgId;
  const initial = useRef(readInfrastructureDraft(draftKey)).current;
  const [facilities, setFacilities] = useState<any[]>([]);
  const [facility, setFacility] = useState(initial.facility);
  const [step, setStep] = useState(initial.step);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [conflictingDraft, setConflictingDraft] = useState(false);
  const requestId = useRef(initial.id);
  const locked = useRef(false);
  useEffect(() => {
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ id: requestId.current, step, facility }),
      );
    } catch {
      /* Current form remains available if storage is disabled. */
    }
  }, [draftKey, step, facility]);

  const load = async () => {
    const { data, error } = await supabase
      .from("organization_facilities")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) setLoadError("Não foi possível consultar a infraestrutura.");
    else {
      setFacilities(data ?? []);
      setLoadError("");
    }
  };
  useEffect(() => {
    void load();
  }, [orgId]);

  const registerFacility = async () => {
    if (locked.current) return;
    const quantity = Number(facility.quantidade);
    if (!Number.isInteger(quantity) || quantity < 1)
      return toast.error("Informe uma quantidade inteira maior que zero.");
    if (!facility.nome.trim() || !facility.ambiente.trim())
      return toast.error("Informe o ambiente e o equipamento.");
    if (facility.foto_path.trim()) {
      try {
        if (new URL(facility.foto_path.trim()).protocol !== "https:")
          throw new Error();
      } catch {
        return toast.error("Informe um link de foto válido com HTTPS.");
      }
    }
    locked.current = true;
    setSaving(true);
    try {
      const { error } = await supabase.from("organization_facilities").insert({
        id: requestId.current,
        organization_id: orgId,
        ambiente: facility.ambiente.trim(),
        nome: facility.nome.trim(),
        categoria: facility.categoria.trim() || null,
        quantidade: quantity,
        foto_path: facility.foto_path.trim() || null,
        observacoes: facility.observacoes.trim() || null,
        image_analysis: {
          source: facility.foto_path.trim() ? "foto" : "cadastro",
          leitura: facility.leitura.trim(),
          submitted_at: new Date().toISOString(),
        },
        analysis_status: "pendente_revisao",
        status: "pendente",
      });
      if (error) {
        const existing = await supabase
          .from("organization_facilities")
          .select(
            "id,ambiente,nome,categoria,quantidade,foto_path,observacoes,image_analysis",
          )
          .eq("id", requestId.current)
          .eq("organization_id", orgId)
          .maybeSingle();
        if (!existing.data) throw error;
        const saved = existing.data;
        const analysis = saved.image_analysis as { leitura?: string } | null;
        if (
          saved.ambiente !== facility.ambiente.trim() ||
          saved.nome !== facility.nome.trim() ||
          saved.quantidade !== quantity ||
          (saved.categoria ?? "") !== facility.categoria.trim() ||
          (saved.foto_path ?? "") !== facility.foto_path.trim() ||
          (saved.observacoes ?? "") !== facility.observacoes.trim() ||
          (analysis?.leitura ?? "") !== facility.leitura.trim()
        ) {
          setConflictingDraft(true);
          await load();
          throw new Error(
            "Este item já foi salvo com outros dados. Confira a lista e use “Cadastrar como novo item” se for outro equipamento.",
          );
        }
      }
      requestId.current = crypto.randomUUID();
      setFacility(emptyFacility());
      setStep(0);
      toast.success("Infraestrutura enviada para aprovação.");
      await load();
    } catch (failure) {
      toast.error(
        (failure as Error).message ||
          "Não foi possível salvar. Tente novamente.",
      );
    } finally {
      locked.current = false;
      setSaving(false);
    }
  };

  const approveFacility = async (item: any) => {
    if (locked.current) return;
    locked.current = true;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("approve_facility_for_workout", {
        p_org: orgId,
        p_facility: item.id,
        p_analysis: item.image_analysis || {},
      });
      if (error) throw error;
      toast.success("Infraestrutura aprovada para prescrição.");
      await load();
    } catch (failure) {
      toast.error(
        (failure as Error).message || "Não foi possível aprovar o item.",
      );
    } finally {
      locked.current = false;
      setSaving(false);
    }
  };
  const fields = [
    <div className="space-y-2">
      <Label htmlFor={orgId + "-ambiente"}>Ambiente</Label>
      <Input
        id={orgId + "-ambiente"}
        disabled={saving}
        value={facility.ambiente}
        onChange={(e) => setFacility({ ...facility, ambiente: e.target.value })}
      />
    </div>,
    <div className="space-y-2">
      <Label htmlFor={orgId + "-nome"}>Equipamento / item</Label>
      <Input
        id={orgId + "-nome"}
        disabled={saving}
        value={facility.nome}
        onChange={(e) => setFacility({ ...facility, nome: e.target.value })}
      />
    </div>,
    <div className="space-y-2">
      <Label htmlFor={orgId + "-categoria"}>Categoria (opcional)</Label>
      <Input
        id={orgId + "-categoria"}
        disabled={saving}
        value={facility.categoria}
        onChange={(e) =>
          setFacility({ ...facility, categoria: e.target.value })
        }
        placeholder="Ex.: cardio, pesos livres"
      />
    </div>,
    <div className="space-y-2">
      <Label htmlFor={orgId + "-quantidade"}>Quantidade</Label>
      <Input
        id={orgId + "-quantidade"}
        disabled={saving}
        type="number"
        min="1"
        value={facility.quantidade}
        onChange={(e) =>
          setFacility({ ...facility, quantidade: e.target.value })
        }
      />
    </div>,
    <div className="space-y-2">
      <Label htmlFor={orgId + "-foto_path"}>Link da foto (opcional)</Label>
      <Input
        id={orgId + "-foto_path"}
        disabled={saving}
        value={facility.foto_path}
        onChange={(e) =>
          setFacility({ ...facility, foto_path: e.target.value })
        }
        placeholder="https://..."
      />
    </div>,
    <div className="space-y-2">
      <Label htmlFor={orgId + "-leitura"}>
        Descrição para revisão técnica (opcional)
      </Label>
      <Textarea
        id={orgId + "-leitura"}
        disabled={saving}
        value={facility.leitura}
        onChange={(e) => setFacility({ ...facility, leitura: e.target.value })}
        placeholder="Descreva a leitura recebida da foto para revisão e aprovação técnica."
      />
    </div>,
    <div className="space-y-2">
      <Label htmlFor={orgId + "-observacoes"}>Observações (opcional)</Label>
      <Textarea
        id={orgId + "-observacoes"}
        disabled={saving}
        value={facility.observacoes}
        onChange={(e) =>
          setFacility({ ...facility, observacoes: e.target.value })
        }
      />
    </div>,
  ];
  return (
    <Card id="infraestrutura" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Infraestrutura e equipamentos</CardTitle>
        <CardDescription>
          Registre a foto, leitura e aprovação da infraestrutura. Somente itens
          aprovados entram na prescrição do morador.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadError && (
          <p role="alert" className="text-destructive">
            {loadError}
          </p>
        )}
        {conflictingDraft && (
          <div role="alert" className="space-y-2 rounded border p-3 text-sm">
            <p>
              O identificador deste rascunho já corresponde a um item salvo.
              Confira a lista antes de continuar.
            </p>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => {
                requestId.current = crypto.randomUUID();
                setFacility((value) => ({ ...value }));
                setConflictingDraft(false);
              }}
            >
              Cadastrar como novo item
            </Button>
          </div>
        )}
        {guided ? (
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground">
              Novo item · {step + 1} de {fields.length}
            </p>
            {fields[step]}
            <div className="flex justify-between gap-3">
              <Button
                variant="ghost"
                disabled={saving || step === 0}
                onClick={() => setStep((value) => value - 1)}
              >
                Voltar
              </Button>
              {step < fields.length - 1 ? (
                <Button
                  disabled={saving}
                  onClick={() => {
                    if (step === 0 && !facility.ambiente.trim())
                      return toast.error("Informe o ambiente.");
                    if (step === 1 && !facility.nome.trim())
                      return toast.error("Informe o equipamento ou item.");
                    if (
                      step === 3 &&
                      (!Number.isInteger(Number(facility.quantidade)) ||
                        Number(facility.quantidade) < 1)
                    )
                      return toast.error(
                        "Informe uma quantidade inteira maior que zero.",
                      );
                    setStep((value) => value + 1);
                  }}
                >
                  Continuar
                </Button>
              ) : (
                <Button disabled={saving} onClick={registerFacility}>
                  {saving ? "Salvando…" : "Salvar item para revisão"}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {fields.map((field, index) => (
                <div key={index}>{field}</div>
              ))}
            </div>
            <Button disabled={saving} onClick={registerFacility}>
              {saving ? "Salvando…" : "Enviar para revisão técnica"}
            </Button>
          </>
        )}
        <div className="space-y-2">
          {facilities.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
            >
              <div>
                <p className="font-medium">
                  {item.ambiente} · {item.nome}{" "}
                  {item.quantidade ? `(${item.quantidade})` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.categoria || "Sem categoria"} · análise{" "}
                  {item.analysis_status || "não analisada"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={item.status === "aprovado" ? "default" : "secondary"}
                >
                  {item.status}
                </Badge>
                {item.status !== "aprovado" && (
                  <Button
                    size="sm"
                    disabled={saving}
                    onClick={() => approveFacility(item)}
                  >
                    Aprovar para treino
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <FitnessInfrastructure key={orgId} orgId={orgId} manage />
      </CardContent>
    </Card>
  );
}
