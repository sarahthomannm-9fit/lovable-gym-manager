import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { OnboardingRoteiro } from './OnboardingRoteiro';

type Org = {
  id: string; nome: string; tipo: string; status: string; cnpj: string | null;
  contato_nome: string | null; contato_email: string | null; contato_telefone: string | null; metadata: any;
};

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
const SUSPENSO = ['suspenso', 'suspended', 'bloqueado'];

/** Detalhe de uma origem para o Adm: Cadastral, Financeiro, Situação de uso e Onboarding / Roteiro de visita. */
export function OrgDetail({ orgId, onChanged }: { orgId: string; onChanged?: () => void }) {
  const [org, setOrg] = useState<Org | null>(null);
  const [form, setForm] = useState({ nome: '', cnpj: '', contato_nome: '', contato_email: '', contato_telefone: '' });
  const [saving, setSaving] = useState(false);
  const [fin, setFin] = useState({ mrr: 0, pendente: 0, vencidas: [] as { id: string; valor: number; data_vencimento: string; aluno: string }[] });
  const [uso, setUso] = useState({ alunos: 0, alunosAtivos: 0, aulasMes: 0, checkins30: 0 });
  const [suspOpen, setSuspOpen] = useState(false);
  const [motivo, setMotivo] = useState('Pagamento vencido');
  const [nota, setNota] = useState('');
  const [confirmNome, setConfirmNome] = useState('');

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('organizations')
      .select('id, nome, tipo, status, cnpj, contato_nome, contato_email, contato_telefone, metadata')
      .eq('id', orgId).maybeSingle();
    const o = data as Org | null;
    setOrg(o);
    if (o) setForm({ nome: o.nome || '', cnpj: o.cnpj || '', contato_nome: o.contato_nome || '', contato_email: o.contato_email || '', contato_telefone: o.contato_telefone || '' });

    const hoje = new Date();
    const hojeIso = hoje.toISOString().slice(0, 10);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
    const trintaAtras = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const { data: alunos } = await supabase.from('alunos').select('id, nome, status').eq('organization_id', orgId).limit(1000);
    const lista = (alunos || []) as any[];
    const ids = lista.map(a => a.id);
    const nomePor = Object.fromEntries(lista.map(a => [a.id, a.nome]));

    let mrr = 0, pendente = 0; const vencidas: any[] = []; let checkins30 = 0;
    if (ids.length) {
      const [{ data: pgs }, { count }] = await Promise.all([
        supabase.from('pagamentos').select('id, aluno_id, valor, status, data_vencimento, data_pagamento').in('aluno_id', ids),
        supabase.from('checkins').select('id', { count: 'exact', head: true }).in('aluno_id', ids).gte('data_checkin', trintaAtras),
      ]);
      checkins30 = count || 0;
      for (const p of (pgs || []) as any[]) {
        const v = Number(p.valor) || 0;
        if (p.status === 'pago') { if ((p.data_pagamento || '') >= inicioMes) mrr += v; }
        else { pendente += v; if (String(p.data_vencimento) < hojeIso) vencidas.push({ id: p.id, valor: v, data_vencimento: p.data_vencimento, aluno: nomePor[p.aluno_id] || 'Aluno' }); }
      }
    }
    setFin({ mrr, pendente, vencidas: vencidas.sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento)) });

    const { count: aulasMes } = await supabase.from('aulas').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).gte('data_aula', inicioMes);
    setUso({ alunos: lista.length, alunosAtivos: lista.filter(a => a.status === 'ativo').length, aulasMes: aulasMes || 0, checkins30 });
  }, [orgId]);

  useEffect(() => { carregar(); }, [carregar]);

  if (!org) return null;
  const suspenso = SUSPENSO.includes(String(org.status).toLowerCase());
  const cnpjTravado = org.status === 'ativo' && !!org.cnpj;

  const salvar = async () => {
    if (!form.nome.trim()) return toast.error('Informe o nome');
    if (form.contato_email && !/^\S+@\S+\.\S+$/.test(form.contato_email)) return toast.error('E-mail inválido');
    setSaving(true);
    const antes = { nome: org.nome, cnpj: org.cnpj, contato_nome: org.contato_nome, contato_email: org.contato_email, contato_telefone: org.contato_telefone };
    const depois = { nome: form.nome.trim(), cnpj: cnpjTravado ? org.cnpj : (form.cnpj.trim() || null), contato_nome: form.contato_nome.trim() || null, contato_email: form.contato_email.trim() || null, contato_telefone: form.contato_telefone.trim() || null };
    const log = [...((org.metadata?.historico_cadastro as any[]) || []), { em: new Date().toISOString(), antes, depois }].slice(-20);
    const { error } = await supabase.from('organizations').update({ ...depois, metadata: { ...(org.metadata || {}), historico_cadastro: log } }).eq('id', org.id);
    setSaving(false);
    if (error) return toast.error('Não foi possível salvar o cadastro');
    toast.success('Cadastro atualizado');
    await carregar(); onChanged?.();
  };

  const alterarAcesso = async (suspender: boolean) => {
    if (suspender && confirmNome.trim() !== org.nome) return toast.error('Digite o nome da organização para confirmar');
    const metadata = suspender
      ? { ...(org.metadata || {}), suspensao: { motivo, nota, em: new Date().toISOString(), status_anterior: org.status } }
      : { ...(org.metadata || {}), suspensao: null };
    const novoStatus = suspender ? 'suspenso' : (org.metadata?.suspensao?.status_anterior || 'ativo');
    const { error } = await supabase.from('organizations').update({ status: novoStatus, metadata }).eq('id', org.id);
    if (error) return toast.error('Não foi possível alterar o acesso');
    toast.success(suspender ? 'Acesso suspenso' : 'Acesso reativado');
    setSuspOpen(false); setConfirmNome(''); setNota('');
    await carregar(); onChanged?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="truncate">{org.nome}</span>
          <Badge variant={suspenso ? 'destructive' : 'secondary'}>{suspenso ? 'Acesso suspenso' : org.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cadastral">
          <TabsList className="mb-4">
            <TabsTrigger value="cadastral">Cadastral</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="uso">Situação de uso</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          </TabsList>

          <TabsContent value="cadastral" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
              <div className="space-y-1"><Label>CNPJ {cnpjTravado && <span className="text-xs text-muted-foreground">(travado após ativação)</span>}</Label><Input value={form.cnpj} disabled={cnpjTravado} onChange={e => setForm({ ...form, cnpj: e.target.value })} /></div>
              <div className="space-y-1"><Label>Representante</Label><Input value={form.contato_nome} onChange={e => setForm({ ...form, contato_nome: e.target.value })} /></div>
              <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={form.contato_email} onChange={e => setForm({ ...form, contato_email: e.target.value })} /></div>
              <div className="space-y-1"><Label>Telefone</Label><Input value={form.contato_telefone} onChange={e => setForm({ ...form, contato_telefone: e.target.value })} /></div>
            </div>
            <Button onClick={salvar} disabled={saving}>{saving ? 'Salvando…' : 'Salvar cadastro'}</Button>
            {Array.isArray(org.metadata?.historico_cadastro) && org.metadata.historico_cadastro.length > 0 && (
              <p className="text-xs text-muted-foreground">Última alteração: {new Date(org.metadata.historico_cadastro.at(-1).em).toLocaleString('pt-BR')} · {org.metadata.historico_cadastro.length} registro(s) no histórico</p>
            )}
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Recebido no mês</p><p className="text-xl font-semibold">{brl(fin.mrr)}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pendente</p><p className="text-xl font-semibold">{brl(fin.pendente)}</p></CardContent></Card>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Faturas vencidas ({fin.vencidas.length})</h3>
              {fin.vencidas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma fatura vencida.</p> : (
                <ul className="divide-y text-sm">
                  {fin.vencidas.slice(0, 15).map(v => (
                    <li key={v.id} className="py-2 flex justify-between gap-2"><span className="truncate">{v.aluno}</span><span className="text-muted-foreground shrink-0">{brl(v.valor)} · venc. {new Date(v.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</span></li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground mt-2">A geração de cobrança ainda não está disponível: não há integração de pagamento por condomínio.</p>
            </div>
            <div className="border-t pt-4">
              {suspenso ? (
                <Button variant="outline" onClick={() => alterarAcesso(false)}>Reativar acesso</Button>
              ) : (
                <Button variant="destructive" onClick={() => setSuspOpen(true)}>Suspender acesso</Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="uso">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([['Alunos', uso.alunos], ['Alunos ativos', uso.alunosAtivos], ['Aulas no mês', uso.aulasMes], ['Check-ins (30 dias)', uso.checkins30]] as const).map(([l, v]) => (
                <Card key={l}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-semibold">{v}</p></CardContent></Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="onboarding">
            <h3 className="text-sm font-medium mb-3">Onboarding / Roteiro de visita</h3>
            <OnboardingRoteiro orgId={org.id} />
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={suspOpen} onOpenChange={setSuspOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspender acesso de {org.nome}</DialogTitle>
            <DialogDescription>Síndico, coaches e moradores perderão o acesso até a reativação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Motivo</Label>
              <select className="w-full border rounded-md bg-background px-3 py-2 text-sm" value={motivo} onChange={e => setMotivo(e.target.value)}>
                <option>Pagamento vencido</option><option>Solicitado pelo condomínio</option><option>Outro</option>
              </select>
            </div>
            <div className="space-y-1"><Label>Anotação</Label><Textarea value={nota} onChange={e => setNota(e.target.value)} /></div>
            <div className="space-y-1"><Label>Para confirmar, digite o nome: <strong>{org.nome}</strong></Label><Input value={confirmNome} onChange={e => setConfirmNome(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="destructive" onClick={() => alterarAcesso(true)}>Confirmar suspensão</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
