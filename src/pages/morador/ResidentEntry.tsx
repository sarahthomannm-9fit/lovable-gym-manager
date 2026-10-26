import { useOperationalContext } from '@/hooks/useOperationalContext';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ResidentEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {memberships}=useOperationalContext();
  const [params] = useSearchParams();
  const [organizations, setOrganizations] = useState<{ id: string; nome: string; requires_invitation:boolean }[]>([]);
  const [organizationId, setOrganizationId] = useState(params.get('organization') || '');
  const [form, setForm] = useState({ nome: '', email: '', unidade: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data, error } = await (supabase as any).rpc('resident_entry_options');
      if (error) throw error;
      setOrganizations(data || []);
    } catch { setError('Não foi possível carregar os condomínios.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const start = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const email = form.email.trim().toLowerCase();
    if (!organizations.some(o => o.id === organizationId) || form.nome.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Confira condomínio, nome e e-mail.');
    if(organizations.find(o=>o.id===organizationId)?.requires_invitation&&!memberships.some(m=>m.organization_id===organizationId&&m.papel==='user'))return toast.error('Este condomínio usa convites. Abra o link enviado pela administração.');
    setSaving(true);
    const pending = { organization_id: organizationId, nome: form.nome.trim(), unidade: form.unidade.trim() };
    try {
      localStorage.setItem('nine:resident-entry', JSON.stringify({ ...pending, email }));
      if (user && user.email?.toLowerCase() === email) {
        const { error } = await (supabase as any).rpc('start_resident_onboarding', { p_organization_id: organizationId, p_nome: pending.nome, p_email: email, p_unidade: pending.unidade });
        if (error) throw error;
        navigate('/morador/onboarding?organization=' + encodeURIComponent(organizationId));
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email, options: {
          emailRedirectTo: window.location.origin + '/morador/onboarding?organization=' + encodeURIComponent(organizationId),
          data: { resident_entry: pending },
        } });
        if (error) throw error;
        setSent(true);
        toast.success('Confira seu e-mail para confirmar o acesso.');
      }
    } catch (e) { toast.error((e as Error).message || 'Não foi possível iniciar o acesso.'); }
    finally { setSaving(false); }
  };
  return <div className="min-h-screen bg-background p-4 sm:p-8"><Card className="mx-auto mt-8 max-w-lg"><CardHeader><p className="text-sm text-primary">Nine Living · Saúde que conecta</p><CardTitle>Comece sua jornada</CardTitle></CardHeader><CardContent>
    {loading ? <p role="status">Carregando condomínios…</p> : error ? <div role="alert">{error}<Button onClick={load}>Tentar novamente</Button></div> : <form onSubmit={start} className="space-y-4">
      {sent && <p role="status">Link enviado para {form.email}. Abra o e-mail para confirmar seu cadastro. Você pode reenviar abaixo.</p>}
      <div><Label>Condomínio</Label><Select value={organizationId} onValueChange={setOrganizationId}><SelectTrigger><SelectValue placeholder="Escolha seu condomínio" /></SelectTrigger><SelectContent>{organizations.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent></Select></div>
      <p className="text-sm text-muted-foreground">Se seu condomínio trabalha com convites, use o link enviado pela administração para ativar o acesso.</p><div><Label htmlFor="resident-name">Nome completo</Label><Input id="resident-name" required minLength={2} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
      <div><Label htmlFor="resident-email">E-mail</Label><Input id="resident-email" required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
      <div><Label htmlFor="resident-unit">Unidade</Label><Input id="resident-unit" value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} /></div>
      <Button type="submit" className="w-full" disabled={saving || !organizations.length}>{saving ? 'Aguarde…' : sent ? 'Reenviar link de acesso' : 'Confirmar e continuar'}</Button>
      <Link className="block text-sm underline" to="/login">Já tenho acesso com senha</Link>
    </form>}
  </CardContent></Card></div>;
}
