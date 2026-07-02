import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Building, Dumbbell, Plus, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

type Lead = any;

const STAGES = [
  { key: "novo", label: "Prospecção" },
  { key: "contato_inicial", label: "Contato Inicial" },
  { key: "proposta_enviada", label: "Proposta Enviada" },
  { key: "negociacao", label: "Negociação" },
  { key: "fechado", label: "Fechado" },
  { key: "perdido", label: "Perdido" },
];

const TIPO_ICON: Record<string, any> = { corporativo: Building, condominio: Building2, estudio: Dumbbell };

export default function PipelineComercial() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [openFu, setOpenFu] = useState(false);
  const [openProp, setOpenProp] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads(data || []);
  };
  useEffect(() => { load(); }, []);

  const loadDrawer = async (l: Lead) => {
    setSelected(l);
    const { data: fu } = await (supabase as any).from("follow_ups").select("*").eq("lead_id", l.id).order("created_at", { ascending: false });
    const { data: pr } = await (supabase as any).from("proposals").select("*").eq("lead_id", l.id).order("created_at", { ascending: false });
    setFollowUps(fu || []); setProposals(pr || []);
  };

  const metrics = useMemo(() => ({
    total: leads.length,
    negociando: leads.filter(l => ["contato_inicial","proposta_enviada","negociacao"].includes(l.status)).length,
    fechadosMes: leads.filter(l => l.status === "fechado" && new Date(l.updated_at).getMonth() === new Date().getMonth()).length,
    conv: leads.length ? Math.round((leads.filter(l => l.status === "fechado").length / leads.length) * 100) : 0,
  }), [leads]);

  const onDrop = async (stage: string) => {
    if (!dragId) return;
    const lead = leads.find(l => l.id === dragId);
    setDragId(null);
    if (!lead || lead.status === stage) return;
    setLeads(prev => prev.map(l => l.id === dragId ? { ...l, status: stage } : l));
    const { error } = await supabase.from("leads").update({ status: stage }).eq("id", lead.id);
    if (error) toast.error("Falha ao mover lead"); else toast.success(`${lead.nome} → ${STAGES.find(s=>s.key===stage)?.label}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Pipeline Comercial</h1>
          <p className="text-sm text-muted-foreground">Gestão de leads da assessoria 9FIT</p>
        </div>
        <Button variant="premium" onClick={() => setOpenNew(true)}><Plus className="w-4 h-4 mr-2" />Novo Lead</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Total de leads", v: metrics.total },
          { l: "Em negociação", v: metrics.negociando },
          { l: "Fechados no mês", v: metrics.fechadosMes },
          { l: "Taxa conversão", v: `${metrics.conv}%` },
        ].map(m => (
          <Card key={m.l}><CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{m.l}</div>
            <div className="text-2xl font-display font-bold text-primary mt-1">{m.v}</div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage.key);
          return (
            <div key={stage.key}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(stage.key)}
              className="bg-muted/30 rounded-lg p-2 min-h-[400px] border border-border/50"
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-primary/70">{stage.label}</span>
                <span className="text-xs text-muted-foreground">{stageLeads.length}</span>
              </div>
              <div className="space-y-2">
                {stageLeads.map(l => {
                  const Icon = TIPO_ICON[l.tipo] || Building;
                  return (
                    <Card key={l.id}
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      onClick={() => loadDrawer(l)}
                      className="cursor-pointer hover:border-primary/40 transition-colors"
                    >
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-gold flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                            {(l.nome_contato || l.nome || "?").slice(0,2).toUpperCase()}
                          </div>
                          <div className="text-xs font-semibold truncate">{l.nome_contato || l.nome}</div>
                        </div>
                        {l.empresa && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Icon className="w-3 h-3" /> {l.empresa}
                          </div>
                        )}
                        {l.fonte && <Badge variant="outline" className="text-[9px] py-0">{l.fonte}</Badge>}
                        {l.orcamento_estimado && (
                          <div className="text-xs font-mono text-primary">R$ {Number(l.orcamento_estimado).toLocaleString('pt-BR')}</div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <NewLeadDialog open={openNew} onOpenChange={setOpenNew} onCreated={load} />

      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.nome_contato || selected.nome}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Empresa" value={selected.empresa} />
                  <Field label="Tipo" value={selected.tipo} />
                  <Field label="Telefone" value={selected.telefone} icon={Phone} />
                  <Field label="Email" value={selected.email} icon={Mail} />
                  <Field label="Fonte" value={selected.fonte} />
                  <Field label="Orçamento" value={selected.orcamento_estimado ? `R$ ${Number(selected.orcamento_estimado).toLocaleString('pt-BR')}` : null} />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setOpenFu(true)}>Registrar follow-up</Button>
                  <Button variant="premium" size="sm" onClick={() => setOpenProp(true)}>Criar proposta</Button>
                </div>

                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-primary/70 mb-2">Follow-ups</h3>
                  {followUps.length === 0 && <div className="text-xs text-muted-foreground">Sem follow-ups.</div>}
                  <div className="space-y-2">
                    {followUps.map(f => (
                      <Card key={f.id}><CardContent className="p-3 text-xs">
                        <div className="flex justify-between mb-1"><Badge variant="outline">{f.tipo}</Badge><span className="text-muted-foreground">{new Date(f.created_at).toLocaleDateString('pt-BR')}</span></div>
                        <div>{f.descricao}</div>
                        {f.proxima_acao && <div className="text-primary mt-1">→ {f.proxima_acao} {f.data_proxima_acao ? `(${f.data_proxima_acao})` : ''}</div>}
                      </CardContent></Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-primary/70 mb-2">Propostas</h3>
                  {proposals.length === 0 && <div className="text-xs text-muted-foreground">Nenhuma proposta ainda.</div>}
                  <div className="space-y-2">
                    {proposals.map(p => (
                      <Card key={p.id}><CardContent className="p-3 text-xs">
                        <div className="flex justify-between"><span className="font-semibold">{p.titulo}</span><Badge>{p.status}</Badge></div>
                        <div className="text-primary font-mono mt-1">R$ {Number(p.valor).toLocaleString('pt-BR')}</div>
                      </CardContent></Card>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <FollowUpDialog open={openFu} onOpenChange={setOpenFu} lead={selected} onCreated={() => selected && loadDrawer(selected)} />
      <ProposalDialog open={openProp} onOpenChange={setOpenProp} lead={selected} onCreated={() => selected && loadDrawer(selected)} />
    </div>
  );
}

function Field({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm flex items-center gap-1.5 mt-0.5">{Icon && <Icon className="w-3 h-3 text-primary" />}{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

function NewLeadDialog({ open, onOpenChange, onCreated }: any) {
  const [form, setForm] = useState<any>({ status: 'novo', tipo: 'corporativo', fonte: 'Instagram' });
  const save = async () => {
    if (!form.nome && !form.nome_contato) return toast.error("Informe o nome do contato");
    const payload = { ...form, nome: form.nome_contato || form.nome };
    const { error } = await supabase.from("leads").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Lead criado"); onOpenChange(false); setForm({ status: 'novo', tipo: 'corporativo' }); onCreated();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome do contato</Label><Input value={form.nome_contato || ''} onChange={e => setForm({...form, nome_contato: e.target.value})} /></div>
          <div><Label>Empresa</Label><Input value={form.empresa || ''} onChange={e => setForm({...form, empresa: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Telefone</Label><Input value={form.telefone || ''} onChange={e => setForm({...form, telefone: e.target.value})} /></div>
            <div><Label>Email</Label><Input value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corporativo">Corporativo</SelectItem>
                  <SelectItem value="condominio">Condomínio</SelectItem>
                  <SelectItem value="estudio">Estúdio</SelectItem>
                  <SelectItem value="infantil">Infantil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Fonte</Label>
              <Select value={form.fonte} onValueChange={v => setForm({...form, fonte: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Instagram','WhatsApp','Indicação','LinkedIn','Site','Outro'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Orçamento estimado (R$)</Label><Input type="number" value={form.orcamento_estimado || ''} onChange={e => setForm({...form, orcamento_estimado: parseFloat(e.target.value) || null})} /></div>
          <div><Label>Observações</Label><Textarea value={form.observacoes || ''} onChange={e => setForm({...form, observacoes: e.target.value})} /></div>
        </div>
        <DialogFooter><Button onClick={save} variant="premium">Criar lead</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FollowUpDialog({ open, onOpenChange, lead, onCreated }: any) {
  const [form, setForm] = useState<any>({ tipo: 'whatsapp' });
  const save = async () => {
    if (!lead) return;
    const { error } = await (supabase as any).from("follow_ups").insert({ ...form, lead_id: lead.id });
    if (error) return toast.error(error.message);
    toast.success("Follow-up registrado"); onOpenChange(false); setForm({ tipo: 'whatsapp' }); onCreated();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar follow-up</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['ligacao','email','whatsapp','reuniao'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Descrição</Label><Textarea value={form.descricao || ''} onChange={e => setForm({...form, descricao: e.target.value})} /></div>
          <div><Label>Próxima ação</Label><Input value={form.proxima_acao || ''} onChange={e => setForm({...form, proxima_acao: e.target.value})} /></div>
          <div><Label>Data próxima ação</Label><Input type="date" value={form.data_proxima_acao || ''} onChange={e => setForm({...form, data_proxima_acao: e.target.value})} /></div>
        </div>
        <DialogFooter><Button onClick={save} variant="premium">Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProposalDialog({ open, onOpenChange, lead, onCreated }: any) {
  const [form, setForm] = useState<any>({ status: 'rascunho' });
  const save = async () => {
    if (!lead) return;
    if (!form.titulo) return toast.error("Informe o título");
    const { error } = await (supabase as any).from("proposals").insert({ ...form, lead_id: lead.id, valor: parseFloat(form.valor) || 0 });
    if (error) return toast.error(error.message);
    toast.success("Proposta criada"); onOpenChange(false); setForm({ status: 'rascunho' }); onCreated();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova proposta</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título</Label><Input value={form.titulo || ''} onChange={e => setForm({...form, titulo: e.target.value})} /></div>
          <div><Label>Valor (R$)</Label><Input type="number" value={form.valor || ''} onChange={e => setForm({...form, valor: e.target.value})} /></div>
          <div><Label>Descrição</Label><Textarea value={form.descricao || ''} onChange={e => setForm({...form, descricao: e.target.value})} /></div>
          <div><Label>Itens inclusos</Label><Textarea value={form.itens_inclusos || ''} onChange={e => setForm({...form, itens_inclusos: e.target.value})} placeholder="Ex: Aulas 3x/semana&#10;Avaliação física trimestral&#10;Suporte via WhatsApp" /></div>
          <div><Label>Validade</Label><Input type="date" value={form.data_validade || ''} onChange={e => setForm({...form, data_validade: e.target.value})} /></div>
        </div>
        <DialogFooter><Button onClick={save} variant="premium">Criar proposta</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
