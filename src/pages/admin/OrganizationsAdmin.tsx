import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

type Org = { id: string; nome: string; tipo: string; status: string; cnpj?: string; metadata?: Record<string, unknown> };
type Member = { id: string; user_id: string; papel: string; organization_id: string };
type Profile = { id: string; nome: string; email: string };
type EligibleUser = Profile & { papel: string };
type Facility = { id: string; ambiente: string; nome: string; categoria: string | null; quantidade: number; status: string; foto_path: string | null };
type Draft = { nome: string; cnpj: string; unidades: string; equipamentos: string; capacidade: string; horarios: string; restricoes: string; sindico: string; sindicoNome: string; sindicoEmail: string; sindicoTelefone: string; coachNome: string; coachEmail: string; coachTelefone: string; professores: string[] };
const initialDraft: Draft = { nome: '', cnpj: '', unidades: '', equipamentos: '', capacidade: '', horarios: 'Seg-Sex 06:00-22:00', restricoes: '', sindico: '', sindicoNome: '', sindicoEmail: '', sindicoTelefone: '', coachNome: '', coachEmail: '', coachTelefone: '', professores: [] };
const ELIGIBLE_ROLES = ['sindico', 'professor'] as const;

export default function OrganizationsAdmin() {
  const [searchParams] = useSearchParams();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  // Achado #5 da auditoria: a seleção de síndico/professor não pode listar qualquer perfil.
  // eligibleUsers traz apenas quem já tem um papel elegível em user_roles.
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
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
  // Achado #3: reenvio sem bloqueio. isSubmitting desabilita o botão e requestId garante
  // idempotência no back end mesmo se o clique disparar duas requisições.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string>(() => crypto.randomUUID());
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('sindico');
  const [inviteLink, setInviteLink] = useState('');
  const [invites, setInvites] = useState<any[]>([]);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<any[]>([]);

  const load = async (): Promise<Org[]> => {
    const [{ data: o }, { data: p }, { data: roles }] = await Promise.all([
      (supabase as any).from('organizations').select('*').order('nome'),
      supabase.from('profiles').select('id, nome, email').order('nome'),
      (supabase as any).from('user_roles').select('user_id, role').in('role', ELIGIBLE_ROLES as unknown as string[]),
    ]);
    setOrgs(o || []);
    setProfiles(p || []);
    const profileMap = new Map((p || []).map((row: Profile) => [row.id, row]));
    const eligible: EligibleUser[] = (roles || [])
      .map((r: { user_id: string; role: string }) => {
        const profile = profileMap.get(r.user_id) as Profile | undefined;
        return profile ? { ...profile, papel: r.role } : null;
      })
      .filter(Boolean) as EligibleUser[];
    setEligibleUsers(eligible);
    return o || [];
  };
  const loadMembers = async (orgId: string) => {
    const { data } = await (supabase as any).from('organization_members')
      .select('*').eq('organization_id', orgId);
    setMembers(data || []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const organizationId = searchParams.get('organization');
    if (!organizationId || selected || !orgs.length) return;
    const organization = orgs.find((org) => org.id === organizationId);
    if (organization) setSelected(organization);
  }, [orgs, searchParams, selected]);
  const loadFacilities = async (orgId: string) => {
    const { data } = await (supabase as any).from('organization_facilities').select('id, ambiente, nome, categoria, quantidade, status, foto_path').eq('organization_id', orgId).order('ambiente').order('nome');
    const rows = data || [];
    setFacilities(rows);
    const urls = await Promise.all(rows.filter((row: Facility) => row.foto_path).map(async (row: Facility) => { const { data: signed } = await supabase.storage.from('organization-facilities').createSignedUrl(row.foto_path!, 3600); return [row.id, signed?.signedUrl || ''] as const; }));
    setFacilityPhotoUrls(Object.fromEntries(urls.filter(([, url]) => url)));
  };
  useEffect(() => { if (selected) { loadMembers(selected.id); loadFacilities(selected.id); (async () => { const { data } = await (supabase as any).from('organization_invites').select('id,email,papel,status,token,expires_at,created_at').eq('organization_id', selected.id).order('created_at', { ascending: false }); setInvites(data || []); })(); } }, [selected]);
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

  const closeWizard = () => { setWizardOpen(false); setWizardStep(1); setDraft(initialDraft); setRequestId(crypto.randomUUID()); };

  // Achados #1, #2 e #3: usa a RPC transacional onboard_condominio (payload compatível com o
  // schema real, rollback completo em caso de falha, e idempotência via requestId) em vez de
  // inserts separados em organizations/organization_members com colunas inexistentes.
  const createOrganization = async () => {
    if (isSubmitting) return;
    if (!draft.nome.trim()) return toast.error('Informe o nome do condomínio.');
    if (!draft.sindicoNome.trim() || !draft.sindicoEmail.trim() || !draft.sindicoEmail.includes('@')) return toast.error('Informe nome e e-mail válidos do síndico responsável.');
    if (draft.coachEmail && (!draft.coachNome.trim() || !draft.coachEmail.includes('@'))) return toast.error('Informe nome e e-mail válidos do coach.');
    setIsSubmitting(true);
    try {
      const createdName = draft.nome.trim();
      const { data: createdOrganization, error } = await (supabase as any).rpc('onboard_condominio', {
        p_request_id: requestId,
        p_nome: draft.nome.trim(),
        p_cnpj: draft.cnpj.trim() || null,
        p_unidades: Number(draft.unidades) || 0,
        p_capacidade: draft.capacidade ? Number(draft.capacidade) : null,
        p_horarios: { padrao: draft.horarios },
        p_restricoes: draft.restricoes.split(',').map((v) => v.trim()).filter(Boolean),
        p_equipamentos: draft.equipamentos.split(',').map((v) => v.trim()).filter(Boolean),
        p_sindico: draft.sindico || null,
        p_professores: draft.professores,
      });
      if (error) return toast.error(error.message || 'Não foi possível criar o condomínio.');
      toast.success('Condomínio criado e onboarding iniciado.');
      closeWizard();
      const refreshedOrgs = await load();
      const createdId = typeof createdOrganization === 'string' ? createdOrganization : createdOrganization?.id;
      const created = refreshedOrgs.find((org) => org.id === createdId || org.nome === createdName);
      if (created) setSelected(created);
      if (created?.id && draft.sindicoEmail.trim()) {
        const { error: inviteError } = await (supabase as any).rpc('create_organization_invite', {
          p_organization_id: created.id,
          p_email: draft.sindicoEmail.trim(),
          p_papel: 'sindico',
        });
        if (inviteError) toast.error(`Condomínio criado, mas não foi possível gerar o acesso do síndico: ${inviteError.message}`);
        else toast.success(`Acesso do síndico preparado para ${draft.sindicoEmail.trim()}.`);
      }
      if (created?.id && draft.coachEmail.trim()) {
        const { error: coachInviteError } = await (supabase as any).rpc('create_organization_invite', {
          p_organization_id: created.id,
          p_email: draft.coachEmail.trim(),
          p_papel: 'professor',
        });
        if (coachInviteError) toast.error(`Condomínio criado, mas não foi possível gerar o acesso do coach: ${coachInviteError.message}`);
        else toast.success(`Acesso do coach preparado para ${draft.coachEmail.trim()}.`);
      }
    } finally {
      setIsSubmitting(false);
    }
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

  const importCsv = async (file: File) => { const text = await file.text(); const lines = text.split(/\r?\n/).filter(Boolean); const headers = lines.shift()?.split(',').map((h) => h.trim().toLowerCase()) || []; const rows = lines.map((line) => { const values = line.split(','); return Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()])); }); setImportRows(rows); };
  const confirmImport = async () => { if (!selected || !importRows.length) return; const { data, error } = await (supabase as any).rpc('bulk_import_residents', { p_organization_id: selected.id, p_rows: importRows }); if (error) return toast.error(error.message); const accepted = importRows.filter((row) => row.nome && row.email && String(row.email).includes('@')); await Promise.all(accepted.map((row) => (supabase as any).rpc('create_organization_invite', { p_organization_id: selected.id, p_email: row.email, p_papel: 'user' }))); toast.success(`${data?.importados || 0} moradores importados e convites preparados.`); setImportErrors(data?.erros || []); setImportRows((data?.erros || []).map((item: any) => item.row)); };

  const sendInvite = async () => { if (!selected || !inviteEmail.trim()) return toast.error('Informe o e-mail.'); const { data, error } = await (supabase as any).rpc('create_organization_invite', { p_organization_id: selected.id, p_email: inviteEmail.trim(), p_papel: inviteRole }); if (error) return toast.error(error.message); const link = `${window.location.origin}/convite/${data?.token}`; setInviteLink(link); toast.success('Acesso preparado. Envie o convite para liberar o acesso.'); setInviteEmail(''); };

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

  // Achado #4: a revisão (e a lista de membros) mostrava o UUID quando o profile não estava
  // carregado. profileName agora busca em eligibleUsers também e nunca deveria cair no UUID
  // para síndico/professor, já que eles vêm de uma lista carregada previamente.
  const profileName = (uid: string) => {
    const fromProfiles = profiles.find((p) => p.id === uid);
    if (fromProfiles) return `${fromProfiles.nome} — ${fromProfiles.email}`;
    const fromEligible = eligibleUsers.find((p) => p.id === uid);
    return fromEligible ? `${fromEligible.nome} — ${fromEligible.email}` : 'Usuário não encontrado';
  };
  const sindicoLabel = () => {
    if (!draft.sindico) return 'Não definido';
    const user = eligibleUsers.find((p) => p.id === draft.sindico);
    return user ? `${user.nome} — ${user.email}` : profileName(draft.sindico);
  };

  return (
    <div className="min-h-full bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><p className="text-[10px] font-mono tracking-[0.18em] uppercase text-primary/70">NINE LIVING · ADMIN</p><h1 className="font-display text-3xl font-normal tracking-tight">Condomínios</h1><p className="text-sm text-muted-foreground">Cadastre o condomínio, equipe e infraestrutura em uma jornada única.</p></div>
        <Dialog open={wizardOpen} onOpenChange={(v) => v ? setWizardOpen(true) : closeWizard()}>
          <DialogTrigger asChild><Button variant="default"><Plus className="w-4 h-4 mr-1" /> Onboarding guiado</Button></DialogTrigger>
          <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Onboarding do condomínio · etapa {wizardStep} de 4</DialogTitle></DialogHeader>
            <div className="flex gap-3 text-xs text-muted-foreground">{['Condomínio', 'Infraestrutura', 'Equipe', 'Revisão'].map((label, i) => <span key={label} className={i + 1 <= wizardStep ? 'text-primary font-medium' : ''}>{i + 1}. {label}</span>)}</div>
            {wizardStep === 1 && <div className="space-y-3"><div><Label>Nome do condomínio</Label><Input autoFocus value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} placeholder="Ex.: Residencial Alto das Palmeiras" /></div><div><Label>CNPJ (opcional)</Label><Input value={draft.cnpj} onChange={(e) => setDraft({ ...draft, cnpj: e.target.value })} /></div></div>}
            {wizardStep === 2 && <div className="space-y-3"><div><Label>Total de unidades</Label><Input type="number" min="0" value={draft.unidades} onChange={(e) => setDraft({ ...draft, unidades: e.target.value })} /></div><div><Label>Capacidade simultânea da academia</Label><Input type="number" min="1" value={draft.capacidade} onChange={(e) => setDraft({ ...draft, capacidade: e.target.value })} placeholder="Ex.: 15" /></div><div><Label>Horário de funcionamento</Label><Input value={draft.horarios} onChange={(e) => setDraft({ ...draft, horarios: e.target.value })} placeholder="Seg-Sex 06:00-22:00" /></div><div><Label>Restrições do espaço (separe por vírgula)</Label><Input value={draft.restricoes} onChange={(e) => setDraft({ ...draft, restricoes: e.target.value })} placeholder="Sem impacto, sem corrida, limite de lotação" /></div><div><Label>Equipamentos (separe por vírgula)</Label><Input value={draft.equipamentos} onChange={(e) => setDraft({ ...draft, equipamentos: e.target.value })} placeholder="Halteres, esteira, bicicleta, colchonetes" /><p className="text-xs text-muted-foreground">As fotos e a validação visual entram no inventário da próxima etapa.</p></div></div>}
            {wizardStep === 3 && <div className="space-y-4"><div><Label>Síndico responsável *</Label><div className="grid gap-2 sm:grid-cols-3"><Input value={draft.sindicoNome} onChange={(e) => setDraft({ ...draft, sindicoNome: e.target.value })} placeholder="Nome completo" /><Input type="email" value={draft.sindicoEmail} onChange={(e) => setDraft({ ...draft, sindicoEmail: e.target.value })} placeholder="E-mail para acesso" /><Input type="tel" value={draft.sindicoTelefone} onChange={(e) => setDraft({ ...draft, sindicoTelefone: e.target.value })} placeholder="Telefone / WhatsApp" /></div></div><div><Label>Coach responsável (opcional)</Label><div className="grid gap-2 sm:grid-cols-3"><Input value={draft.coachNome} onChange={(e) => setDraft({ ...draft, coachNome: e.target.value })} placeholder="Nome completo" /><Input type="email" value={draft.coachEmail} onChange={(e) => setDraft({ ...draft, coachEmail: e.target.value })} placeholder="E-mail para acesso" /><Input type="tel" value={draft.coachTelefone} onChange={(e) => setDraft({ ...draft, coachTelefone: e.target.value })} placeholder="Telefone / WhatsApp" /></div></div><p className="text-xs text-muted-foreground">Ao concluir, os acessos do síndico e do coach serão preparados automaticamente. Moradores podem ser importados em lote depois.</p></div>}
            {wizardStep === 4 && <div className="rounded-sm border p-4 space-y-2 text-sm"><p><strong>Condomínio:</strong> {draft.nome || '—'}</p><p><strong>Unidades:</strong> {draft.unidades || 'Não informado'}</p><p><strong>Infraestrutura:</strong> {draft.equipamentos || 'A validar'}</p><p><strong>Capacidade:</strong> {draft.capacidade || 'A definir'}</p><p><strong>Horários:</strong> {draft.horarios || 'A definir'}</p><p><strong>Restrições:</strong> {draft.restricoes || 'Nenhuma informada'}</p><p><strong>Síndico:</strong> {draft.sindicoNome || '—'} · {draft.sindicoEmail || 'E-mail não informado'} · {draft.sindicoTelefone || 'Telefone não informado'}</p><p><strong>Coach:</strong> {draft.coachNome || 'Não informado'} · {draft.coachEmail || 'Não informado'} · {draft.coachTelefone || 'Não informado'}</p><p className="text-primary">Os convites do síndico e do coach serão preparados automaticamente.</p></div>}
            <div className="flex justify-between pt-3"><Button variant="ghost" disabled={wizardStep === 1 || isSubmitting} onClick={() => setWizardStep((s) => s - 1)}>Voltar</Button>{wizardStep < 4 ? <Button disabled={isSubmitting} onClick={() => setWizardStep((s) => s + 1)}>Continuar</Button> : <Button onClick={createOrganization} disabled={isSubmitting}>{isSubmitting ? 'Criando...' : 'Criar condomínio'}</Button>}</div>
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

      <Card className="rounded-sm shadow-elegant">
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

        <Card className="rounded-sm shadow-elegant"><CardHeader><CardTitle>Importar moradores</CardTitle><p className="text-sm text-muted-foreground">CSV com colunas nome, email e unidade.</p></CardHeader><CardContent className="space-y-3"><Input type="file" accept=".csv,text/csv" onChange={(e) => { const file = e.target.files?.[0]; if (file) void importCsv(file); }} />{importRows.length > 0 && <div className="space-y-2"><p className="text-sm">{importRows.length} linhas prontas para importar.</p>{importErrors.length > 0 && <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-2 text-xs space-y-1"><p className="font-medium text-destructive">{importErrors.length} linhas rejeitadas</p>{importErrors.map((item: any, index: number) => <p key={index}>{item.row?.email || 'sem e-mail'} · {item.error}</p>)}</div>}<div className="max-h-32 overflow-y-auto rounded-sm border p-2 text-xs">{importRows.slice(0, 5).map((row, index) => <div key={index}>{row.nome || '—'} · {row.email || 'sem e-mail'} · {row.unidade || '—'}</div>)}</div><Button onClick={confirmImport}>Confirmar importação</Button></div>}</CardContent></Card>

        <Card className="rounded-sm shadow-elegant"><CardHeader><CardTitle>Entrada do condomínio</CardTitle><p className="text-sm text-muted-foreground">Use este endereço para gerar o QR Code da academia.</p></CardHeader><CardContent><div className="flex flex-wrap gap-4 items-center"><div className="rounded-sm border bg-white p-3"><img className="h-36 w-36" alt="QR Code de entrada do condomínio" src={selected ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`${window.location.origin}/entrada?organization=${selected.id}`)}` : ""} /></div><div className="flex-1 min-w-[260px] space-y-2"><Input readOnly value={selected ? `${window.location.origin}/entrada?organization=${selected.id}` : ''} /><Button variant="outline" onClick={() => { if (selected) { navigator.clipboard.writeText(`${window.location.origin}/entrada?organization=${selected.id}`); toast.success("Link de entrada copiado."); } }}>Copiar link</Button><p className="text-xs text-muted-foreground">Imprima este QR Code e coloque na entrada da academia.</p></div></div></CardContent></Card>

        <Card className="rounded-sm shadow-elegant"><CardHeader><CardTitle>Convites do condomínio</CardTitle></CardHeader><CardContent>{!invites.length ? <p className="text-sm text-muted-foreground">Nenhum convite enviado.</p> : <div className="space-y-2">{invites.map((invite) => <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2 text-sm"><span>{invite.email}<span className="block text-xs text-muted-foreground">{invite.papel} · expira {new Date(invite.expires_at).toLocaleDateString('pt-BR')}</span></span><div className="flex items-center gap-2">{invite.status === "pendente" && <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/convite/${invite.token}`); toast.success("Link copiado."); }}>Copiar link</Button>}<Badge variant="outline">{invite.status}</Badge>{invite.status !== "pendente" && <Button size="sm" variant="ghost" onClick={async () => { const { error } = await (supabase as any).rpc("resend_organization_invite", { p_invite_id: invite.id }); if (error) toast.error(error.message); else toast.success("Novo convite criado."); }}>Reenviar</Button>}{invite.status === "pendente" && <Button size="sm" variant="ghost" onClick={async () => { const { error } = await (supabase as any).rpc("cancel_organization_invite", { p_invite_id: invite.id }); if (error) toast.error(error.message); else { toast.success("Convite cancelado."); if (selected) { const { data } = await (supabase as any).from("organization_invites").select("id,email,papel,status,expires_at,created_at").eq("organization_id", selected.id).order("created_at", { ascending: false }); setInvites(data || []); } } }}>Cancelar</Button>}</div></div>)}</div>}</CardContent></Card>

        <Card className="rounded-sm shadow-elegant"><CardHeader><CardTitle>Personas e acessos</CardTitle><p className="text-sm text-muted-foreground">Cadastre síndico, coach ou morador e envie o convite para liberar o acesso ao condomínio.</p></CardHeader><CardContent className="flex flex-wrap gap-2 items-end"><div className="flex-1 min-w-[220px]"><Label>E-mail</Label><Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="pessoa@email.com" /></div><div><Label>Persona</Label><Select value={inviteRole} onValueChange={setInviteRole}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sindico">Síndico</SelectItem><SelectItem value="professor">Coach</SelectItem><SelectItem value="user">Morador</SelectItem></SelectContent></Select></div><Button onClick={sendInvite}>Preparar convite</Button>{inviteLink && <div className="w-full rounded-sm border border-primary/30 bg-primary/5 p-3 text-sm"><p className="font-medium">Acesso preparado</p><div className="flex gap-2 mt-2"><Input readOnly value={inviteLink} /><Button type="button" variant="outline" onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Link copiado."); }}>Copiar</Button></div></div>}</CardContent></Card>

        <Card>
          <CardHeader><CardTitle>Membros — {selected.nome}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex-1 min-w-[200px]">
                <Label>Usuário</Label>
                <Select value={newMember.user_id} onValueChange={(v) => setNewMember({ ...newMember, user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {eligibleUsers.filter((p) => p.papel === newMember.papel).map((p) => <SelectItem key={p.id} value={p.id}>{p.nome} — {p.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Papel</Label>
                <Select value={newMember.papel} onValueChange={(v) => setNewMember({ ...newMember, papel: v, user_id: '' })}>
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
      </>)}
    </div>
  );
}

