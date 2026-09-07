import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { UserPlus, Shield, ShieldCheck, ShieldAlert, Trash2, KeyRound, Link2, Copy, UserX } from 'lucide-react';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Navigate } from 'react-router-dom';

type AppRole = 'admin' | 'manager' | 'user';

interface UserRow {
  user_id: string;
  email: string;
  role: AppRole;
}

interface AlunoSemAcesso {
  id: string;
  nome: string;
  email: string | null;
}

export function UsersAdmin() {
  const { isAdmin, loading: roleLoading } = useCurrentUserRole();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  // form criação de usuário "solto" (sem vínculo com aluno)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>('user');
  const [submitting, setSubmitting] = useState(false);

  // alunos sem acesso vinculado
  const [alunosSemAcesso, setAlunosSemAcesso] = useState<AlunoSemAcesso[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);

  // modal "criar acesso" para um aluno
  const [linkDialogAluno, setLinkDialogAluno] = useState<AlunoSemAcesso | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkMode, setLinkMode] = useState<'password' | 'magiclink'>('password');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [generatedMagicLink, setGeneratedMagicLink] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'list' },
    });
    if (error || data?.error) {
      toast.error('Erro ao carregar usuários');
    } else {
      setUsers(data?.users || []);
    }
    setLoading(false);
  };

  const fetchAlunosSemAcesso = async () => {
    setLoadingAlunos(true);
    const { data, error } = await supabase
      .from('alunos')
      .select('id, nome, email')
      .is('user_id', null)
      .order('nome');
    if (error) {
      toast.error('Erro ao carregar alunos sem acesso');
    } else {
      setAlunosSemAcesso(data || []);
    }
    setLoadingAlunos(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchAlunosSemAcesso();
    }
  }, [isAdmin]);

  if (roleLoading) return <div className="p-8 text-muted-foreground">Carregando...</div>;
  if (!isAdmin) return <Navigate to="/painel" replace />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Senha precisa ter ao menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'create', email, password, role },
    });
    if (error || data?.error) {
      toast.error(data?.error || 'Erro ao criar usuário');
    } else {
      toast.success('Usuário criado!');
      setEmail(''); setPassword(''); setRole('user');
      fetchUsers();
    }
    setSubmitting(false);
  };

  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`Excluir ${userEmail}? Essa ação é irreversível.`)) return;
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'delete', userId },
    });
    if (error || data?.error) toast.error('Erro ao excluir');
    else { toast.success('Usuário removido'); fetchUsers(); }
  };

  const handleResetPassword = async (userEmail: string) => {
    const newPass = prompt(`Nova senha para ${userEmail} (mín 6 chars):`);
    if (!newPass || newPass.length < 6) return;
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'reset_password', email: userEmail, password: newPass },
    });
    if (error || data?.error) toast.error('Erro ao redefinir');
    else toast.success('Senha redefinida');
  };

  const handleChangeRole = async (userId: string, newRole: AppRole) => {
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'set_role', userId, role: newRole },
    });
    if (error || data?.error) toast.error('Erro ao alterar role');
    else { toast.success('Permissão atualizada'); fetchUsers(); }
  };

  const openLinkDialog = (aluno: AlunoSemAcesso) => {
    setLinkDialogAluno(aluno);
    setLinkEmail(aluno.email || '');
    setLinkMode('password');
    setLinkPassword('');
    setGeneratedMagicLink(null);
  };

  const closeLinkDialog = () => {
    setLinkDialogAluno(null);
    setLinkEmail('');
    setLinkPassword('');
    setGeneratedMagicLink(null);
  };

  const handleCreateAndLink = async () => {
    if (!linkDialogAluno) return;
    if (!linkEmail.trim()) {
      toast.error('Informe um e-mail.');
      return;
    }
    if (linkMode === 'password' && linkPassword.length < 6) {
      toast.error('Senha precisa ter ao menos 6 caracteres.');
      return;
    }
    setLinkSubmitting(true);
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: {
        action: 'create_and_link_aluno',
        alunoId: linkDialogAluno.id,
        email: linkEmail.trim(),
        password: linkMode === 'password' ? linkPassword : undefined,
      },
    });
    if (error || data?.error) {
      toast.error(data?.error || 'Erro ao criar acesso');
    } else {
      toast.success(`Acesso criado para ${linkDialogAluno.nome}!`);
      if (data?.magic_link) {
        setGeneratedMagicLink(data.magic_link);
      } else {
        closeLinkDialog();
      }
      fetchAlunosSemAcesso();
      fetchUsers();
    }
    setLinkSubmitting(false);
  };

  const copyMagicLink = () => {
    if (!generatedMagicLink) return;
    navigator.clipboard.writeText(generatedMagicLink);
    toast.success('Link copiado!');
  };

  const roleIcon = (r: AppRole) =>
    r === 'admin' ? <ShieldAlert className="w-3 h-3" /> :
    r === 'manager' ? <ShieldCheck className="w-3 h-3" /> :
    <Shield className="w-3 h-3" />;

  const roleColor = (r: AppRole) =>
    r === 'admin' ? 'bg-destructive/15 text-destructive border-destructive/30' :
    r === 'manager' ? 'bg-primary/15 text-primary border-primary/30' :
    'bg-muted text-muted-foreground';

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crie, remova e gerencie permissões dos usuários do NINE LIVING.
        </p>
      </div>

      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserX className="w-4 h-4 text-amber-500" /> Alunos sem acesso ({alunosSemAcesso.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Alunos cadastrados que ainda não têm login para acessar o app. Crie o acesso abaixo.
          </p>
        </CardHeader>
        <CardContent>
          {loadingAlunos ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : alunosSemAcesso.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              Todos os alunos já têm acesso vinculado. 🎉
            </div>
          ) : (
            <div className="space-y-2">
              {alunosSemAcesso.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-md border border-amber-500/20 bg-amber-500/5">
                  <div>
                    <div className="text-sm font-medium text-foreground">{a.nome}</div>
                    <div className="text-xs text-muted-foreground">{a.email || 'sem e-mail cadastrado'}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openLinkDialog(a)} className="gap-1.5">
                    <Link2 className="w-3.5 h-3.5" /> Criar acesso
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="w-4 h-4" /> Novo usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="new-email" className="text-xs">E-mail</Label>
              <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pass" className="text-xs">Senha (mín 6)</Label>
              <Input id="new-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Permissão</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={submitting} className="md:col-span-4">
              {submitting ? 'Criando...' : 'Criar usuário'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuários cadastrados ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.user_id} className="flex items-center justify-between p-3 rounded-md border border-border/40 bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase">
                      {u.email.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{u.email}</div>
                      <Badge variant="outline" className={`mt-1 text-[10px] gap-1 ${roleColor(u.role)}`}>
                        {roleIcon(u.role)} {u.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={u.role} onValueChange={(v) => handleChangeRole(u.user_id, v as AppRole)}>
                      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" onClick={() => handleResetPassword(u.email)} title="Redefinir senha">
                      <KeyRound className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(u.user_id, u.email)} title="Excluir">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6">Nenhum usuário ainda.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!linkDialogAluno} onOpenChange={(open) => !open && closeLinkDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar acesso para {linkDialogAluno?.nome}</DialogTitle>
            <DialogDescription>
              Escolha como o aluno vai receber o acesso ao app.
            </DialogDescription>
          </DialogHeader>

          {generatedMagicLink ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Acesso criado! Envie este link para o aluno entrar sem senha:
              </p>
              <div className="flex items-center gap-2">
                <Input readOnly value={generatedMagicLink} className="text-xs" />
                <Button size="icon" variant="outline" onClick={copyMagicLink}><Copy className="w-4 h-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground">O link expira após o primeiro uso ou em um curto período — envie o quanto antes.</p>
              <DialogFooter>
                <Button onClick={closeLinkDialog}>Concluir</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">E-mail do aluno</Label>
                <Input type="email" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} />
              </div>

              <RadioGroup value={linkMode} onValueChange={(v) => setLinkMode(v as 'password' | 'magiclink')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="password" id="mode-password" />
                  <Label htmlFor="mode-password" className="text-sm font-normal">Definir senha manualmente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="magiclink" id="mode-magiclink" />
                  <Label htmlFor="mode-magiclink" className="text-sm font-normal">Gerar link mágico (sem senha)</Label>
                </div>
              </RadioGroup>

              {linkMode === 'password' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Senha (mín 6 caracteres)</Label>
                  <Input type="text" value={linkPassword} onChange={(e) => setLinkPassword(e.target.value)} />
                </div>
              )}

              <DialogFooter>
                <Button variant="ghost" onClick={closeLinkDialog}>Cancelar</Button>
                <Button onClick={handleCreateAndLink} disabled={linkSubmitting}>
                  {linkSubmitting ? 'Criando...' : 'Criar acesso'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
