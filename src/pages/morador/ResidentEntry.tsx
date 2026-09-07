import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function ResidentEntry() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<{ id: string; nome: string }[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [form, setForm] = useState({ nome: '', email: '', unidade: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => { (async () => { const { data } = await (supabase as any).from('organizations').select('id, nome').eq('tipo', 'condominio').eq('status', 'ativo').order('nome'); setOrganizations(data || []); })(); }, []);
  const start = async () => {
    if (!organizationId || !form.nome || !form.email) return toast.error('Preencha condomínio, nome e e-mail.');
    setSaving(true);
    const { data, error } = await (supabase as any).rpc('start_resident_onboarding', { p_organization_id: organizationId, p_nome: form.nome, p_email: form.email, p_unidade: form.unidade });
    if (error) toast.error(error.message); else { sessionStorage.setItem('9fit:onboarding:aluno', data); toast.success('Cadastro iniciado.'); navigate('/morador/onboarding'); }
    setSaving(false);
  };
  return <div className="min-h-screen bg-background p-4 sm:p-8"><Card className="mx-auto mt-8 max-w-lg"><CardHeader><p className="text-sm font-medium text-primary">Nine Living · Saúde que conecta</p><CardTitle>Comece seu onboarding</CardTitle><p className="text-sm text-muted-foreground">Escolha seu condomínio e responda algumas perguntas para receber um treino adequado.</p></CardHeader><CardContent className="space-y-4"><div><Label>Condomínio</Label><Select value={organizationId} onValueChange={setOrganizationId}><SelectTrigger><SelectValue placeholder="Escolha seu condomínio" /></SelectTrigger><SelectContent>{organizations.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent></Select></div><div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div><div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div><div><Label>Unidade (opcional)</Label><Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} /></div><Button className="w-full" disabled={saving} onClick={start}>{saving ? 'Iniciando…' : 'Continuar para triagem'}</Button></CardContent></Card></div>;
}

