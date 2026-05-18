import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

type Org = { id: string; nome: string; tipo: string; status: string; cnpj?: string };
type Member = { id: string; user_id: string; papel: string; organization_id: string };
type Profile = { id: string; nome: string; email: string };

export default function OrganizationsAdmin() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Org | null>(null);
  const [newOrg, setNewOrg] = useState({ nome: '', tipo: 'condominio', cnpj: '' });
  const [newMember, setNewMember] = useState({ user_id: '', papel: 'sindico' });

  const load = async () => {
    const [{ data: o }, { data: p }] = await Promise.all([
      (supabase as any).from('organizations').select('*').order('nome'),
      supabase.from('profiles').select('id, nome, email').order('nome'),
    ]);
    setOrgs(o || []); setProfiles(p || []);
  };
  const loadMembers = async (orgId: string) => {
    const { data } = await (supabase as any).from('organization_members')
      .select('*').eq('organization_id', orgId);
    setMembers(data || []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selected) loadMembers(selected.id); }, [selected]);

  const criarOrg = async () => {
    if (!newOrg.nome) return toast.error('Nome obrigatório');
    const { error } = await (supabase as any).from('organizations').insert(newOrg);
    if (error) return toast.error(error.message);
    toast.success('Organização criada');
    setNewOrg({ nome: '', tipo: 'condominio', cnpj: '' });
    load();
  };

  const removerOrg = async (id: string) => {
    if (!confirm('Excluir organização?')) return;
    const { error } = await (supabase as any).from('organizations').delete().eq('id', id);
    if (error) return toast.error(error.message);
    if (selected?.id === id) setSelected(null);
    load();
  };

  const addMember = async () => {
    if (!selected || !newMember.user_id) return toast.error('Selecione usuário');
    const { error } = await (supabase as any).from('organization_members').insert({
      organization_id: selected.id, user_id: newMember.user_id, papel: newMember.papel,
    });
    if (error) return toast.error(error.message);
    toast.success('Membro adicionado');
    setNewMember({ user_id: '', papel: 'sindico' });
    loadMembers(selected.id);
  };

  const removerMember = async (id: string) => {
    const { error } = await (supabase as any).from('organization_members').delete().eq('id', id);
    if (error) return toast.error(error.message);
    if (selected) loadMembers(selected.id);
  };

  const profileName = (uid: string) => profiles.find((p) => p.id === uid)?.nome || uid.slice(0, 8);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organizações</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Nova organização</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar organização</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={newOrg.nome} onChange={(e) => setNewOrg({ ...newOrg, nome: e.target.value })} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={newOrg.tipo} onValueChange={(v) => setNewOrg({ ...newOrg, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="condominio">Condomínio</SelectItem>
                    <SelectItem value="corporate">Corporativo</SelectItem>
                    <SelectItem value="professor">Profissional</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>CNPJ</Label><Input value={newOrg.cnpj} onChange={(e) => setNewOrg({ ...newOrg, cnpj: e.target.value })} /></div>
              <Button onClick={criarOrg} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {orgs.map((o) => (
                <TableRow key={o.id} className={selected?.id === o.id ? 'bg-muted/30' : ''}>
                  <TableCell className="font-medium">{o.nome}</TableCell>
                  <TableCell><span className="text-xs uppercase">{o.tipo}</span></TableCell>
                  <TableCell>{o.status}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(o)}>
                      <Users className="w-4 h-4 mr-1" /> Membros
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removerOrg(o.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {orgs.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Nenhuma organização ainda.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader><CardTitle>Membros — {selected.nome}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex-1 min-w-[200px]">
                <Label>Usuário</Label>
                <Select value={newMember.user_id} onValueChange={(v) => setNewMember({ ...newMember, user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome} — {p.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Papel</Label>
                <Select value={newMember.papel} onValueChange={(v) => setNewMember({ ...newMember, papel: v })}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sindico">Síndico</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="corporate">Corporate (RH)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addMember}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
            </div>

            <Table>
              <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Papel</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{profileName(m.user_id)}</TableCell>
                    <TableCell><span className="text-xs uppercase">{m.papel}</span></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => removerMember(m.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Sem membros.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
