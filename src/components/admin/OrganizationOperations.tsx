import { OrganizationAcceptance } from '@/components/admin/OrganizationAcceptance';
import { OrganizationInfrastructure } from '@/components/admin/OrganizationInfrastructure';
import { FitnessDeliveryReadiness } from '@/components/admin/FitnessDeliveryReadiness';
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ServiceRequestsBoard } from "@/components/admin/ServiceRequestsBoard";
import { OperationsActivation } from "@/components/admin/OperationsActivation";
import { CondominiumReadiness } from '@/components/admin/CondominiumReadiness';

const STATUS_LABELS: Record<string, string> = { pendente: "Pendente", em_andamento: "Em andamento", bloqueado: "Bloqueado", concluido: "Concluído" };

export function OrganizationOperations({ orgId, orgName, profile, onProfileSaved }: { orgId: string; orgName: string; profile?: Record<string, any>; onProfileSaved: (profile: Record<string, any>) => void }) {
  const [steps, setSteps] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [operationalProfile, setOperationalProfile] = useState<Record<string, string>>({ mercado: profile?.mercado || "NINE LIVING", produto: profile?.produto || "NINE LIVING PRO", responsavel: profile?.responsavel || "Sarah", etapa: profile?.etapa || "diagnostico", support_phone: profile?.support_phone || "", support_hours: profile?.support_hours || "" });

  const load = async () => {
    const [stepResult] = await Promise.all([
      (supabase as any).from("organization_implementation_steps").select("*").eq("organization_id", orgId).order("created_at"),
    ]);
    setSteps(stepResult.data || []);
  };
  useEffect(() => { setOperationalProfile({ mercado: profile?.mercado || "NINE LIVING", produto: profile?.produto || "NINE LIVING PRO", responsavel: profile?.responsavel || "Sarah", etapa: profile?.etapa || "diagnostico", support_phone: profile?.support_phone || "", support_hours: profile?.support_hours || "" }); load(); }, [orgId]);

  const seedSteps = async () => { const { error } = await (supabase as any).rpc("seed_organization_implementation", { p_organization_id: orgId }); if (error) toast.error(error.message); else { toast.success("Playbook operacional criado"); load(); } };
  const saveProfile = async () => { const phone = (operationalProfile.support_phone || '').replace(/\D/g, ''); if (phone && (phone.length < 10 || phone.length > 15)) return toast.error("Informe WhatsApp com DDI e DDD"); setSaving(true); const { error } = await (supabase as any).from("organizations").update({ operational_profile: operationalProfile }).eq("id", orgId); setSaving(false); if (error) toast.error(error.message); else { onProfileSaved(operationalProfile); toast.success("Perfil operacional salvo"); } };
  const setStepStatus = async (id: string, status: string) => { const patch: any = { status }; if (status === "concluido") patch.completed_at = new Date().toISOString(); const { error } = await (supabase as any).from("organization_implementation_steps").update(patch).eq("id", id); if (error) toast.error(error.message); else load(); };


  return <div className="space-y-6"><CondominiumReadiness orgId={orgId} /><FitnessDeliveryReadiness key={orgId} orgId={orgId} /><Card id="perfil-operacional" className="scroll-mt-24"><CardHeader><CardTitle>Operação NINE LIVING · {orgName}</CardTitle><CardDescription>Perfil comercial, responsável e fase da implementação do condomínio.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div><Label>Mercado</Label><Input value={operationalProfile.mercado} onChange={e => setOperationalProfile({ ...operationalProfile, mercado: e.target.value })} /></div><div><Label>Produto contratado</Label><Input value={operationalProfile.produto} onChange={e => setOperationalProfile({ ...operationalProfile, produto: e.target.value })} /></div><div><Label>Responsável</Label><Select value={operationalProfile.responsavel} onValueChange={v => setOperationalProfile({ ...operationalProfile, responsavel: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sarah">Sarah</SelectItem><SelectItem value="Rony">Rony</SelectItem></SelectContent></Select></div><div><Label>Etapa</Label><Select value={operationalProfile.etapa} onValueChange={v => setOperationalProfile({ ...operationalProfile, etapa: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="diagnostico">Diagnóstico</SelectItem><SelectItem value="setup">Setup</SelectItem>{operationalProfile.etapa === "operacao" && <SelectItem value="operacao" disabled>Operação ativada</SelectItem>}<SelectItem value="expansao">Expansão</SelectItem></SelectContent></Select></div><div><Label>WhatsApp do suporte (DDI + DDD + número)</Label><Input type="tel" value={operationalProfile.support_phone || ""} onChange={e => setOperationalProfile({ ...operationalProfile, support_phone: e.target.value })} placeholder="5511999999999" /></div><div><Label>Horário de atendimento do suporte</Label><Input value={operationalProfile.support_hours || ""} onChange={e => setOperationalProfile({ ...operationalProfile, support_hours: e.target.value })} placeholder="Ex.: segunda a sexta, 8h às 18h" /></div><div className="md:col-span-2"><Button onClick={saveProfile} disabled={saving}>Salvar perfil operacional</Button></div></CardContent></Card>
<Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Playbook de implementação</CardTitle><CardDescription>Controle ponto a ponto da entrega contratada.</CardDescription></div><Button variant="outline" onClick={seedSteps}>Gerar playbook</Button></CardHeader><CardContent className="space-y-2">{steps.length === 0 ? <p className="text-sm text-muted-foreground">Gere o playbook para iniciar a operação deste condomínio.</p> : steps.map(step => <div key={step.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><p className="font-medium">{step.title}</p><p className="text-xs text-muted-foreground">Responsável: {step.owner}</p></div><div className="flex items-center gap-2"><Badge variant={step.status === "concluido" ? "default" : "secondary"}>{STATUS_LABELS[step.status]}</Badge><Select value={step.status} onValueChange={value => setStepStatus(step.id, value)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABELS).map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div></div>)}</CardContent></Card>
<OrganizationInfrastructure key={orgId} orgId={orgId} /><ServiceRequestsBoard orgId={orgId} /><OrganizationAcceptance key={orgId} orgId={orgId} /><OperationsActivation orgId={orgId} onActivated={() => onProfileSaved({ ...operationalProfile, etapa: "operacao" })} /></div>;
}
