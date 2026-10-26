import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAlunoVinculo } from '@/hooks/useAlunoVinculo';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function MoradorProfile() {
  const { user, signOut } = useAuth();
  const { aluno, loading } = useAlunoVinculo();
  const [form, setForm] = useState({ nome: '', telefone: '', unidade: '', notifications: true });
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setError('');
    if (!aluno) return;
    setReading(true);
    void (async () => {
      try {
        const { data, error } = await (supabase as any).from('alunos').select('nome,telefone,unidade,notifications_enabled').eq('id', aluno.id).single();
        if (error) throw error;
        if (live) setForm({ nome: data.nome, telefone: data.telefone || '', unidade: data.unidade || '', notifications: data.notifications_enabled !== false });
      } catch { if (live) setError('Não foi possível carregar seu perfil.'); }
      finally { if (live) setReading(false); }
    })();
    return () => { live = false; };
  }, [aluno?.id]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!aluno || busy || form.nome.trim().length < 2) return;
    setBusy(true);
    try {
      const { error } = await (supabase as any).rpc('save_resident_profile', { p_aluno_id: aluno.id, p_nome: form.nome.trim(), p_telefone: form.telefone.trim(), p_unidade: form.unidade.trim(), p_notifications: form.notifications });
      if (error) throw error;
      toast.success('Perfil atualizado.');
    } catch (e) { toast.error((e as Error).message || 'Falha ao salvar perfil.'); }
    finally { setBusy(false); }
  };
  const recover = async () => {
    if (!user?.email || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin + '/reset-password' });
      if (error) throw error;
      toast.success('Confira seu e-mail para alterar a senha.');
    } catch { toast.error('Falha ao enviar recuperação. Tente novamente.'); }
    finally { setBusy(false); }
  };
  return <PersonaLayout title="Meu perfil"><Card className="max-w-xl"><CardContent className="p-6 space-y-4">
    <p className="text-sm text-muted-foreground">{user?.email}</p>
    {loading || reading ? <p role="status">Carregando perfil…</p> : error ? <div role="alert">{error}<Button onClick={() => window.location.reload()}>Tentar novamente</Button></div> : !aluno ? <p>Cadastro não vinculado. Solicite apoio à administração.</p> : <form onSubmit={save}><fieldset disabled={busy} className="space-y-4">
      <div><Label htmlFor="profile-name">Nome completo</Label><Input id="profile-name" required minLength={2} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
      <div><Label htmlFor="profile-phone">Telefone / WhatsApp</Label><Input id="profile-phone" type="tel" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
      <div><Label htmlFor="profile-unit">Unidade</Label><Input id="profile-unit" value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} /></div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.notifications} onCheckedChange={value => setForm({ ...form, notifications: value === true })} />Receber avisos opcionais no aplicativo</label>
      <Button type="submit">{busy ? 'Salvando…' : 'Salvar perfil'}</Button>
    </fieldset></form>}
    <div className="flex gap-2 flex-wrap"><Button variant="outline" disabled={busy} onClick={recover}>Alterar senha por e-mail</Button><Button variant="ghost" onClick={async () => { await signOut(); window.location.assign('/login'); }}>Sair da conta</Button></div>
  </CardContent></Card></PersonaLayout>;
}
