import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { onboardingProgress } from '@/components/admin/OnboardingRoteiro';
import { toast } from 'sonner';
import { Building2, Plus, Search } from 'lucide-react';

const db = supabase as any;
const TIPOS: Record<string, string> = { condominio: 'Condomínio', corporate: 'Corporativo', professor: 'Coach/Professor', studio: 'Studio' };
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const soDigitos = (s: string) => s.replace(/\D/g, '');

export default function OrigensAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<'todas' | 'ativas' | 'suspensas' | 'pendentes'>('todas');
  const [busca, setBusca] = useState('');
  const [novo, setNovo] = useState(false);
  const [susp, setSusp] = useState<any>(null);
  const [motivo, setMotivo] = useState('');
  const [confirma, setConfirma] = useState('');
  const [avisar, setAvisar] = useState(true);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ nome: '', tipo: 'condominio', cnpj: '', contato_nome: '', contato_email: '', contato_telefone: '' });

  const load = useCallback(async () => {
    const [o, a] = await Promise.all([
      db.from('organizations').select('id,nome,tipo,status,cnpj,contato_nome,contato_email,contato_telefone,metadata,created_at').order('nome'),
      db.from('alunos').select('id,organization_id,status,valor_mensalidade').limit(5000),
    ]);
    if (o.error) toast.error('Não foi possível carregar as origens');
    setOrgs(o.data || []);
    setAlunos(a.data || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const m: Record<string, { ativos: number; total: number; mrr: number }> = {};
    alunos.forEach((a) => {
      if (!a.organization_id) return;
      const s = (m[a.organization_id] ||= { ativos: 0, total: 0, mrr: 0 });
      s.total++;
      if ((a.status || 'ativo') === 'ativo') { s.ativos++; s.mrr += Number(a.valor_mensalidade || 0); }
    });
    return m;
  }, [alunos]);

  const lista = orgs.filter((o) => {
    if (busca && !o.nome?.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtro === 'ativas') return o.status === 'ativo';
    if (filtro === 'suspensas') return o.status === 'suspenso';
    if (filtro === 'pendentes') return o.status !== 'ativo' && o.status !== 'suspenso';
    return true;
  });
  const mrrTotal = Object.entries(stats).reduce((s, [id, v]) => s + (orgs.find((o) => o.id === id)?.status === 'suspenso' ? 0 : v.mrr), 0);

  const cadastrar = async () => {
    const nome = f.nome.trim();
    if (nome.length < 3) return toast.error('Informe o nome da origem');
    const cnpj = soDigitos(f.cnpj);
    if (f.cnpj && cnpj.length !== 14) return toast.error('CNPJ precisa ter 14 dígitos');
    if (f.contato_email && !/^\S+@\S+\.\S+$/.test(f.contato_email)) return toast.error('E-mail inválido');
    if (orgs.some((o) => o.nome?.trim().toLowerCase() === nome.toLowerCase())) return toast.error('Já existe uma origem com esse nome');
    if (cnpj && orgs.some((o) => soDigitos(o.cnpj || '') === cnpj)) return toast.error('Já existe uma origem com esse CNPJ');
    setBusy(true);
    const { error } = await db.from('organizations').insert({
      nome, tipo: f.tipo, cnpj: cnpj || null, contato_nome: f.contato_nome || null,
      contato_email: f.contato_email || null, contato_telefone: f.contato_telefone || null, status: 'ativo',
    });
    setBusy(false);
    if (error) return toast.error(error.message || 'Não foi possível cadastrar');
    toast.success('Origem cadastrada');
    setNovo(false);
    setF({ nome: '', tipo: 'condominio', cnpj: '', contato_nome: '', contato_email: '', contato_telefone: '' });
    load();
  };

  const suspender = async () => {
    if (!susp) return;
    if (!motivo.trim()) return toast.error('Informe o motivo da suspensão');
    if (confirma.trim().toLowerCase() !== susp.nome.trim().toLowerCase()) return toast.error('Digite o nome da origem para confirmar');
    setBusy(true);
    const meta = susp.metadata || {};
    const registro = { motivo: motivo.trim(), em: new Date().toISOString() };
    const { error } = await db.from('organizations').update({
      status: 'suspenso',
      metadata: { ...meta, suspensao: registro, suspensoes_historico: [...(meta.suspensoes_historico || []), registro] },
    }).eq('id', susp.id);
    if (error) { setBusy(false); return toast.error(error.message || 'Não foi possível suspender'); }
    if (avisar) {
      const { data: sind } = await db.from('organization_members').select('user_id').eq('organization_id', susp.id).eq('papel', 'sindico');
      const rows = (sind || []).map((s: any) => ({
        tipo: 'sistema', titulo: 'Acesso suspenso', mensagem: `O acesso de ${susp.nome} foi suspenso. Motivo: ${motivo.trim()}`,
        destinatario_tipo: 'funcionario', destinatario_id: s.user_id, prioridade: 'urgente', status: 'enviada', canal: ['app'],
        dados_extras: { organization_id: susp.id },
      }));
      if (rows.length) await db.from('notificacoes').insert(rows);
    }
    setBusy(false);
    toast.success(`${susp.nome} suspensa. Síndico, coach e moradores verão "Acesso suspenso".`);
    setSusp(null); setMotivo(''); setConfirma('');
    load();
  };

  const reativar = async (o: any) => {
    const meta = { ...(o.metadata || {}) };
    delete meta.suspensao;
    const { error } = await db.from('organizations').update({ status: 'ativo', metadata: meta }).eq('id', o.id);
    if (error) return toast.error(error.message || 'Não foi possível reativar');
    toast.success(`${o.nome} reativada`);
    load();
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Origens</h1>
          <p className="text-sm text-muted-foreground">{orgs.length} origens · MRR ativo {brl(mrrTotal)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/organizacoes')}>Onboarding e convites</Button>
          <Button onClick={() => setNovo(true)}><Plus className="w-4 h-4 mr-1" />Nova origem</Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative"><Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" /><Input className="pl-8 w-56" placeholder="Buscar origem" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
        <div className="flex gap-1 overflow-x-auto">
          {(['todas', 'ativas', 'suspensas', 'pendentes'] as const).map((k) => <Button key={k} size="sm" className="capitalize shrink-0" variant={filtro === k ? 'default' : 'outline'} onClick={() => setFiltro(k)}>{k}</Button>)}
        </div>
      </div>

      {loading ? <p className="text-sm text-muted-foreground py-10 text-center">Carregando origens…</p> : lista.length === 0 ? (
        <Card><CardContent className="py-14 text-center space-y-2"><Building2 className="w-9 h-9 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">{orgs.length === 0 ? 'Nenhuma origem cadastrada. Crie a primeira em "Nova origem".' : 'Nenhuma origem neste filtro.'}</p></CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {lista.map((o) => {
            const s = stats[o.id] || { ativos: 0, total: 0, mrr: 0 };
            const p = onboardingProgress(o.metadata);
            const suspensa = o.status === 'suspenso';
            return (
              <Card key={o.id} className={suspensa ? 'border-destructive/40' : ''}><CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="font-medium truncate">{o.nome}</p><p className="text-xs text-muted-foreground">{TIPOS[o.tipo] || o.tipo}{o.cnpj ? ` · CNPJ ${o.cnpj}` : ''}</p></div>
                  <Badge variant={suspensa ? 'destructive' : o.status === 'ativo' ? 'default' : 'secondary'}>{suspensa ? 'Suspensa' : o.status === 'ativo' ? 'Ativa' : 'Pendente'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{s.ativos} alunos ativos · MRR {brl(s.mrr)} · Onboarding {p.done}/{p.total}</p>
                {suspensa && o.metadata?.suspensao && <p className="text-xs text-destructive">Motivo: {o.metadata.suspensao.motivo}</p>}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => navigate('/admin/organizacoes')}>Onboarding</Button>
                  {suspensa ? <Button size="sm" onClick={() => reativar(o)}>Reativar acesso</Button> : <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setSusp(o); setMotivo(''); setConfirma(''); }}>Suspender acesso</Button>}
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}

      <Dialog open={novo} onOpenChange={setNovo}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova origem</DialogTitle><DialogDescription>Para o fluxo completo com blocos, equipamentos e convites, use Onboarding e convites.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
            <div><Label>Tipo</Label><Select value={f.tipo} onValueChange={(v) => setF({ ...f, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TIPOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>CNPJ (opcional)</Label><Input value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: e.target.value })} /></div>
            <div><Label>Representante</Label><Input value={f.contato_nome} onChange={(e) => setF({ ...f, contato_nome: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>E-mail</Label><Input type="email" value={f.contato_email} onChange={(e) => setF({ ...f, contato_email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={f.contato_telefone} onChange={(e) => setF({ ...f, contato_telefone: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNovo(false)}>Cancelar</Button><Button disabled={busy} onClick={cadastrar}>Cadastrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!susp} onOpenChange={(o) => !o && setSusp(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Suspender {susp?.nome}</DialogTitle><DialogDescription>Síndico, coaches e moradores passam a ver "Acesso suspenso". Você pode reativar a qualquer momento.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Motivo (obrigatório)</Label><Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={avisar} onChange={(e) => setAvisar(e.target.checked)} />Notificar o síndico</label>
            <div><Label>Digite o nome da origem para confirmar</Label><Input value={confirma} onChange={(e) => setConfirma(e.target.value)} placeholder={susp?.nome} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSusp(null)}>Cancelar</Button><Button variant="destructive" disabled={busy} onClick={suspender}>Suspender acesso</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
