import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { routeForRole } from '@/hooks/useOperationalContext';
import { AppRole } from '@/hooks/useCurrentUserRole';

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const accept = async () => {
    if (!token) return;
    if (!user) {
      toast.error('Entre com o e-mail que recebeu o convite antes de aceitar.');
      navigate(`/login?redirect=/convite/${token}`);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any).rpc('accept_organization_invite', { p_token: token });
    setLoading(false);
    if (error) {
      // Mostra a mensagem original da RPC, sem mascarar o motivo real.
      toast.error(error.message);
      return;
    }
    toast.success('Convite aceito. Acesso liberado.');
    navigate(routeForRole((data?.papel as AppRole) ?? null));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-sm shadow-elegant">
        <CardHeader>
          <p className="text-[10px] font-mono tracking-[0.18em] uppercase text-primary/70">NINE LIVING</p>
          <CardTitle className="font-display text-2xl font-normal">Aceitar convite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Aceite este convite para acessar o condomínio e a função operacional atribuída.
          </p>
          {user
            ? <p className="text-xs text-muted-foreground">Conta autenticada: {user.email}</p>
            : <p className="text-xs text-amber-400">Você precisa entrar com o mesmo e-mail do convite.</p>}
          <Button className="w-full" onClick={accept} disabled={loading}>
            {loading ? 'Vinculando…' : 'Aceitar convite'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
