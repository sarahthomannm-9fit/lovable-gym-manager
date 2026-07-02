import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Dumbbell, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NIVEL_COLOR: Record<string, string> = {
  iniciante: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  intermediario: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  avancado: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function PlanosTreino() {
  const { user } = useAuth();
  const [planos, setPlanos] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [openNew, setOpenNew] = useState(false);
  const [openAssign, setOpenAssign] = useState<any | null>(null);
  const [filter, setFilter] = useState<string>("todos");

  const load = async () => {
    const { data } = await supabase.from("planos_treino").select("*").order("created_at", { ascending: false });
    setPlanos(data || []);
    if (data?.length) {
      const { data: ex } = await supabase.from("plano_exercicios").select("plano_treino_id");
      const map: Record<string, number> = {};
      (ex || []).forEach((e: any) => { map[e.plano_treino_id] = (map[e.plano_treino_id] || 0) + 1; });
      setCounts(map);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = planos.filter(p => {
    if (filter === 'meus') return p.professor_id === user?.id;
    if (filter === 'publicos') return p.publico;
    if (['iniciante','intermediario','avancado'].includes(filter)) return p.nivel === filter;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Planos de Treino</h1>
          <p className="text-sm text-muted-foreground">Crie e atribua planos aos alunos</p>
        </div>
        <Button variant="premium" onClick={() => setOpenNew(true)}><Plus className="w-4 h-4 mr-2" />Novo Plano</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          {k:'todos',l:'Todos'},{k:'meus',l:'Meus'},{k:'publicos',l:'Públicos'},
          {k:'iniciante',l:'Iniciante'},{k:'intermediario',l:'Intermediário'},{k:'avancado',l:'Avançado'},
        ].map(f => (
          <Button key={f.k} size="sm" variant={filter === f.k ? 'premium' : 'outline'} onClick={() => setFilter(f.k)}>{f.l}</Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <Card key={p.id} className="hover:border-primary/40">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  <span className="font-display font-bold">{p.nome}</span>
                </div>
                {p.publico && <Badge variant="outline" className="text-[10px]">Público</Badge>}
              </div>
              {p.nivel && <Badge className={NIVEL_COLOR[p.nivel] || ''}>{p.nivel}</Badge>}
              {p.objetivo && <div className="text-xs text-muted-foreground">{p.objetivo}</div>}
              <div className="text-xs font-mono text-primary/70">{p.semanas || 4} sem · {p.dias_semana || 3}d/sem · {counts[p.id] || 0} exercícios</div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setOpenAssign(p)}><UserCheck className="w-3 h-3 mr-1" />Atribuir</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="md:col-span-3"><CardContent className="p-10 text-center text-muted-foreground">Nenhum plano ainda. Clique em "Novo Plano".</CardContent></Card>
        )}
      </div>

      <NewPlanoDialog open={openNew} onOpenChange={setOpenNew} onCreated={load} userId={user?.id} />
      <AssignDialog plano={openAssign} onClose={() => setOpenAssign(null)} userId={user?.id} />
    </div>
  );
}

function NewPlanoDialog({ open, onOpenChange, onCreated, userId }: any) {
  const [form, setForm] = useState<any>({ nivel: 'iniciante', objetivo: 'Hipertrofia', semanas: 4, dias_semana: 3, publico: false });
  const save = async () => {
    if (!form.nome) return toast.error("Informe o nome");
    const { error } = await supabase.from("planos_treino").insert({ ...form, professor_id: userId });
    if (error) return toast.error(error.message);
    toast.success("Plano criado"); onOpenChange(false); setForm({ nivel: 'iniciante', objetivo: 'Hipertrofia', semanas: 4, dias_semana: 3 }); onCreated();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo plano de treino</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={form.nome || ''} onChange={e => setForm({...form, nome: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Objetivo</Label>
              <Select value={form.objetivo} onValueChange={v => setForm({...form, objetivo: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Emagrecimento','Hipertrofia','Condicionamento','Reabilitação','Outro'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nível</Label>
              <Select value={form.nivel} onValueChange={v => setForm({...form, nivel: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['iniciante','intermediario','avancado'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Semanas</Label><Input type="number" value={form.semanas} onChange={e => setForm({...form, semanas: parseInt(e.target.value) || 4})} /></div>
            <div><Label>Dias/semana</Label><Input type="number" value={form.dias_semana} onChange={e => setForm({...form, dias_semana: parseInt(e.target.value) || 3})} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea value={form.descricao || ''} onChange={e => setForm({...form, descricao: e.target.value})} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.publico || false} onChange={e => setForm({...form, publico: e.target.checked})} /> Público (outros coaches podem usar)</label>
        </div>
        <DialogFooter><Button onClick={save} variant="premium">Criar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ plano, onClose, userId }: any) {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (plano) supabase.from("alunos").select("id, nome").eq("status","ativo").order("nome").then(({ data }) => setAlunos(data || []));
  }, [plano]);
  const save = async () => {
    if (!form.aluno_id || !form.data_inicio) return toast.error("Preencha aluno e data");
    const { error } = await supabase.from("treinos").insert({
      aluno_id: form.aluno_id,
      plano_treino_id: plano.id,
      professor_id: userId,
      nome: plano.nome,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Treino atribuído! Aluno notificado."); onClose();
  };
  return (
    <Dialog open={!!plano} onOpenChange={o => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Atribuir: {plano?.nome}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Aluno</Label>
            <Select value={form.aluno_id} onValueChange={v => setForm({...form, aluno_id: v})}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{alunos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Início</Label><Input type="date" value={form.data_inicio || ''} onChange={e => setForm({...form, data_inicio: e.target.value})} /></div>
            <div><Label>Fim (opcional)</Label><Input type="date" value={form.data_fim || ''} onChange={e => setForm({...form, data_fim: e.target.value})} /></div>
          </div>
        </div>
        <DialogFooter><Button onClick={save} variant="premium">Atribuir</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
