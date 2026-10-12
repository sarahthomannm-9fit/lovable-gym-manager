import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Users, Link2, QrCode } from 'lucide-react';
import { toast } from 'sonner';

type Org = { id: string; nome: string; tipo: string; status: string; cnpj?: string; metadata?: Record<string, unknown> };
type Member = { id: string; user_id: string; papel: string; organization_id: string };
type Profile = { id: string; nome: string; email: string };
type Facility = { id: string; ambiente: string; nome: string; categoria: string | null; quantidade: number; status: string; foto_path: string | null };
type Draft = { nome: string; cnpj: string; unidades: string; equipamentos: string; sindico: string; professores: string[] };
const initialDraft: Draft = { nome: '', cnpj: '', unidades: '', equipamentos: '', sindico: '', professores: [] };

export default function OrganizationsAdmin() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Org | null>(null);
  const [newOrg, setNewOrg] = useState({ nome: '', tipo: 'condominio', cnpj: '' });
  const [newMember, setNewMember] = useState({ user_id: '', papel: 'sindico' });
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [newFacility, setNewFacility] = useState({ ambiente: '', nome: '', categoria: '', quantidade: '1' });
  const [facilityPhoto, setFacilityPhoto] = useState<File | null>(null);
  const [facilityPhotoUrls, setFacilityPhotoUrls] = useState<Record<string, string>>({});
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(initialDraft);

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
  const loadFacilities = async (orgId: string) => {
    const { data } = await (supabase as any).from('organization_facilities').select('id, ambiente, nome, categoria, quantidade, status, foto_path').eq('organization_id', orgId).order('ambiente').order('nome');
    const rows = data || [];
    setFacilities(rows);
    const urls = await Promise.all(rows.filter((row: Facility) => row.foto_path).map(async (row: Facility) => { const { data: signed } = await supabase.storage.from('organization-facilities').createSignedUrl(row.foto_path!, 3600); return [row.id, signed?.signedUrl || ''] as const; }));
    setFacilityPhotoUrls(Object.fromEntries(urls.filter(([, url]) => url)));
  };
  useEffect(() => { if (selected) { loadMembers(selected.id); loadFacilities(selected.id); } }, [selected]);
  const addFacility = async () => {
    if (!selected || !newFacility.ambiente.trim() || !newFacility.nome.trim()) return toast.error('Informe ambiente e equipamento.');
    let foto_path: string | null = null;
    if (facilityPhoto) {
      const safeName = facilityPhoto.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      foto_path = `${selected.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('organization-facilities').upload(foto_path, facilityPhoto, { upsert: false, contentType: facilityPhoto.type });
      if (uploadError) return toast.error(`Não foi possível enviar a foto: ${uploadError.message}`);
    }
    const { error } = await (supabase as any).from('organization_facilities').insert({ organization_id: selected.id, ambiente: newFacility.ambiente.trim(), nome: newFacility.nome.trim(), categoria: newFacility.categoria.trim() || null, quantidade: Math.max(0, Number(newFacility.quantidade) || 1), foto_path });
    if (error) return toast.error(error.message);
    setNewFacility({ ambiente: '', nome: '', categoria: '', quantidade: '1' }); setFacilityPhoto(null); toast.success('Equipamento adicionado.'); loadFacilities(selected.id);
  };
  const approveFacility = async (id: string, status: 'aprovado' | 'inativo') => {
    const { error } = await (supabase as any).rpc('approve_facility', { p_facility_id: id, p_status: status });
    if (error) return toast.error(error.message);
    toast.success(status === 'aprovado' ? 'Equipamento aprovado.' : 'Equipamento desativado.'); if (selected) loadFacilities(selected.id);
  };

  const closeWizard = () => { setWizardOpen(false); setWizardStep(1); setDraft(initialDraft); };
  const createOrganization = async () => {
    if (!draft.nome.trim()) return toast.error('Informe o nome do condomínio.');
    const metadata = { total_unidades: Number(draft.unidades) || 0, infraestrutura: draft.equipamentos.split(',').map((v) => v.trim()).filter(Boolean), onboarding_status: 'infraestrutura_pendente' };
    const { data: org, error } = await (supabase as any).from('organizations').insert({ nome: draft.nome.trim(), tipo: 'condominio', cnpj: draft.cnpj.trim() || null, metadata }).select('id').single();
    if (error || !org) return toast.error(error?.message || 'Não foi possível criar o condomínio.');
    const assignments = [draft.sindico ? { organization_id: org.id, user_id: draft.sindico, papel: 'sindico' } : null, ...draft.professores.map((user_id) => ({ organization_id: org.id, user_id, papel: 'professor' }))].filter(Boolean);
    if (assignments.length) { const { error: memberError } = await (supabase as any).from('organization_members').insert(assignments); if (memberError) toast.error(`Condomínio criado, mas membros não foram vinculados: ${memberError.message}`); }
    toast.success('Condomínio criado e onboarding iniciado.'); closeWizard(); await load();
  };
  const toggleProfessor = (id: string) => setDraft((d) => ({ ...d, professores: d.professores.includes(id) ? d.professores.filter((p) => p !== id) : [...d.professores, id] }));

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
        <Dialog open={wizardOpen} onOpenChange={(v) => v ? setWizardOpen(true) : closeWizard()}>
          <DialogTrigger asChild><Button variant="default"><Plus className="w-4 h-4 mr-1" /> Onboarding guiado</Button></DialogTrigger>
          <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Onboarding do condomínio · etapa {wizardStep} de 4</DialogTitle></DialogHeader>
            <div className="flex gap-3 text-xs text-muted-foreground">{['Condomínio', 'Infraestrutura', 'Equipe', 'Revisão'].map((label, i) => <span key={label} className={i + 1 <= wizardStep ? 'text-primary font-medium' : ''}>{i + 1}. {label}</span>)}</div>
            {wizardStep === 1 && <div className="space-y-3"><div><Label>Nome do condomínio</Label><Input autoFocus value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} placeholder="Ex.: Residencial Alto das Palmeiras" /></div><div><Label>CNPJ (opcional)</Label><Input value={draft.cnpj} onChange={(e) => setDraft({ ...draft, cnpj: e.target.value })} /></div></div>}
            {wizardStep === 2 && <div className="space-y-3"><div><Label>Total de unidades</Label><Input type="number" min="0" value={draft.unidades} onChange={(e) => setDraft({ ...draft, unidades: e.target.value })} /></div><div><Label>Equipamentos (separe por vírgula)</Label><Input value={draft.equipamentos} onChange={(e) => setDraft({ ...draft, equipamentos: e.target.value })} placeholder="Halteres, esteira, bicicleta, colchonetes" /><p className="text-xs text-muted-foreground">As fotos e a validação visual entram no inventário da próxima etapa.</p></div></div>}
            {wizardStep === 3 && <div className="space-y-3"><div><Label>Síndico responsável</Label><Select value={draft.sindico} onValueChange={(v) => setDraft({ ...draft, sindico: v })}><SelectTrigger><SelectValue placeholder="Selecione um usuário existente" /></SelectTrigger><SelectContent>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome} — {p.email}</SelectItem>)}</SelectContent></Select></div><div><Label>Professores</Label><div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1">{profiles.map((p) => <label key={p.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.professores.includes(p.id)} onChange={() => toggleProfessor(p.id)} />{p.nome} — {p.email}</label>)}</div></div></div>}
            {wizardStep === 4 && <div className="rounded-lg border p-4 space-y-2 text-sm"><p><strong>Condomínio:</strong> {draft.nome || '—'}</p><p><strong>Unidades:</strong> {draft.unidades || 'Não informado'}</p><p><strong>Infraestrutura:</strong> {draft.equipamentos || 'A validar'}</p><p><strong>Síndico:</strong> {draft.sindico || 'Não definido'}</p><p><strong>Professores selecionados:</strong> {draft.professores.length}</p><p className="text-primary">O cadastro ficará pendente de validação da infraestrutura.</p></div>}
            <div className="flex justify-between pt-3"><Button variant="ghost" disabled={wizardStep === 1} onClick={() => setWizardStep((s) => s - 1)}>Voltar</Button>{wizardStep < 4 ? <Button onClick={() => setWizardStep((s) => s + 1)}>Continuar</Button> : <Button onClick={createOrganization}>Criar condomínio</Button>}</div>
          </DialogContent>
        </Dialog>
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

      {selected && (<>
        <Card><CardHeader><CardTitle>Infraestrutura da academia</CardTitle><p className="text-sm text-muted-foreground">{facilities.length ? `${facilities.filter((f) => f.status === "aprovado").length}/${facilities.length} equipamentos aprovados` : "Nenhum item cadastrado"}</p></CardHeader><CardContent className="space-y-4">
          <div className="grid sm:grid-cols-5 gap-2 items-end"><div><Label>Ambiente</Label><Input value={newFacility.ambiente} onChange={(e) => setNewFacility({ ...newFacility, ambiente: e.target.value })} placeholder="Sala fitness" /></div><div><Label>Equipamento</Label><Input value={newFacility.nome} onChange={(e) => setNewFacility({ ...newFacility, nome: e.target.value })} placeholder="Halteres" /></div><div><Label>Categoria</Label><Input value={newFacility.categoria} onChange={(e) => setNewFacility({ ...newFacility, categoria: e.target.value })} placeholder="Força" /></div><div><Label>Qtd.</Label><Input type="number" min="0" value={newFacility.quantidade} onChange={(e) => setNewFacility({ ...newFacility, quantidade: e.target.value })} /></div><div><Label>Foto</Label><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFacilityPhoto(e.target.files?.[0] || null)} /></div></div>
          <Button onClick={addFacility}><Plus className="w-4 h-4 mr-1" /> Adicionar equipamento</Button>
          <Table><TableHeader><TableRow><TableHead>Foto</TableHead><TableHead>Ambiente</TableHead><TableHead>Equipamento</TableHead><TableHead>Qtd.</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>{facilities.map((f) => <TableRow key={f.id}><TableCell>{facilityPhotoUrls[f.id] ? <img src={facilityPhotoUrls[f.id]} alt={`Foto de ${f.nome}`} className="h-10 w-10 rounded object-cover" /> : <span className="text-xs text-muted-foreground">Sem foto</span>}</TableCell><TableCell>{f.ambiente}</TableCell><TableCell>{f.nome}</TableCell><TableCell>{f.quantidade}</TableCell><TableCell className="text-xs uppercase">{f.status}</TableCell><TableCell className="text-right">{f.status === 'pendente' && <Button size="sm" onClick={() => approveFacility(f.id, 'aprovado')}>Aprovar</Button>}{f.status === 'aprovado' && <Button size="sm" variant="ghost" onClick={() => approveFacility(f.id, 'inativo')}>Desativar</Button>}</TableCell></TableRow>)}{!facilities.length && <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">Nenhum equipamento cadastrado.</TableCell></TableRow>}</TableBody></Table>
        </CardContent></Card>

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

