import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const personaLabel: Record<string, string> = { sindico: 'Síndico', professor: 'Coach', user: 'Morador' };

export default function FirstAccess() {
  const { user } = useAuth();
  const { refresh } = useOperationalContext();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const persona = params.get('persona') || 'user';
  const [nome, setNome] = useState((user?.user_metadata as any)?.nome || '');
  const [telefone, setTelefone] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || nome.trim().length < 2) return toast.error('Informe seu nome completo.');
    setSaving(true);
    const { error } = await (supabase as any).from('profiles').upsert({ id: user.id, nome: nome.trim(), email: user.email, telefone: telefone.trim() || null }, { onConflict: 'id' });
    setSaving(false);
    if (error) return toast.error(`Não foi possível concluir seu cadastro: ${error.message}`);
    await refresh();
    toast.success('Cadastro concluído.');
    navigate('/select-context', { replace: true });
  };

  return <div className="min-h-screen bg-background flex items-center justify-center p-4"><Card className="w-full max-w-md rounded-sm shadow-elegant"><CardHeader><p className="text-[10px] font-mono tracking-[0.18em] uppercase text-primary/70">NINE LIVING · PRIMEIRO ACESSO</p><CardTitle className="font-display text-2xl font-normal">Complete seu cadastro</CardTitle><p className="text-sm text-muted-foreground">Acesso como {personaLabel[persona] || 'usuário'}. Confirme seus dados para entrar no Manager.</p></CardHeader><CardContent className="space-y-4"><div><Label>Nome completo</Label><Input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" /></div><div><Label>Telefone / WhatsApp</Label><Input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" /></div><Button className="w-full" onClick={save} disabled={saving}>{saving ? 'Salvando…' : 'Concluir e entrar'}</Button></CardContent></Card></div>;
}

