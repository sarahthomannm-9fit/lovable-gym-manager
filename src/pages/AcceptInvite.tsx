import { FormEvent, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const roleRoute = (role?: string | null) => {
  switch (role) {
    case 'sindico': return '/sindico';
    case 'professor': return '/coach';
    case 'corporate': return '/corp';
    case 'user':
    case 'morador':
    case 'residente':
    case 'aluno': return '/morador';
    case 'admin':
    case 'manager': return '/painel';
    default: return '/select-context';
  }
};

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [existingAccount, setExistingAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const invitedEmail = new URLSearchParams(window.location.search).get('email');
    if (invitedEmail) setEmail(invitedEmail.toLowerCase());
  }, []);

  const accept = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return toast.error('Convite inválido ou incompleto.');
    if (!email || !password) return toast.error('Informe e-mail e senha.');
    setLoading(true);
    try {
      const invitedEmail = email.trim().toLowerCase();
      let activeSession = session;
      // Convites são vinculados ao e-mail. Nunca reutilize uma sessão de outra pessoa.
      if (activeSession?.user?.email?.toLowerCase() !== invitedEmail) {
        if (activeSession) {
          await signOut();
          activeSession = null;
        }
      }
      if (!activeSession) {
        if (existingAccount) {
          const { data, error } = await supabase.auth.signInWithPassword({ email: invitedEmail, password });
          if (error) throw error;
          activeSession = data.session;
        } else {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: { data: { nome: name.trim() || undefined, invited_via: token } },
          });
          if (error) throw error;
          activeSession = data.session;
          if (!activeSession) {
            toast.success('Cadastro criado. Confirme seu e-mail e reabra o convite para concluir.');
            return;
          }
        }
      }
      const { data, error } = await (supabase as any).rpc('accept_organization_invite', { p_token: token });
      if (error) throw error;
      const role = data?.papel || data?.role || data?.app_role;
      toast.success('Convite aceito. Seu acesso foi configurado.');
      navigate(roleRoute(role), { replace: true });
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível concluir o convite.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <Card className="w-full max-w-md rounded-sm shadow-elegant">
      <CardHeader>
        <p className="text-[10px] font-mono tracking-[0.18em] uppercase text-primary/70">NINE LIVING</p>
        <CardTitle className="font-display text-2xl font-normal">Ativar seu acesso</CardTitle>
        <p className="text-sm text-muted-foreground">Crie sua conta Nine Living com o e-mail usado no convite. Você será levado automaticamente ao painel da sua persona.</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={accept}>
          {!existingAccount && <div><Label htmlFor="invite-name">Nome</Label><Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" autoComplete="name" /></div>}
          <div><Label htmlFor="invite-email">E-mail do convite</Label><Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
          <div><Label htmlFor="invite-password">{existingAccount ? 'Senha' : 'Crie uma senha'}</Label><Input id="invite-password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={existingAccount ? 'current-password' : 'new-password'} /></div>
          <Button className="w-full" type="submit" disabled={loading}>{loading ? 'Configurando acesso…' : existingAccount ? 'Entrar e aceitar convite' : 'Criar conta e entrar'}</Button>
          <button type="button" className="w-full text-sm text-muted-foreground underline" onClick={() => setExistingAccount((value) => !value)}>{existingAccount ? 'Ainda não tenho conta' : 'Já tenho uma conta'}</button>
        </form>
      </CardContent>
    </Card>
  </div>;
}
