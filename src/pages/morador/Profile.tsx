import { useAuth } from '@/contexts/AuthContext';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function MoradorProfile() {
  const { user } = useAuth();
  const initials = (user?.email || 'M').slice(0, 1).toUpperCase();
  return (
    <PersonaLayout title="Perfil" accent="#1B6E6E">
      <Card className="max-w-xl bg-card/60 border-border/40">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 pb-5 border-b border-border/40">
            <div className="w-12 h-12 border border-foreground flex items-center justify-center font-serif text-xl">{initials}</div>
            <div><h2 className="font-serif text-xl">{user?.user_metadata?.nome || 'Morador'}</h2><p className="text-sm text-muted-foreground">{user?.email}</p></div>
          </div>
          <div className="divide-y divide-border/40">
            <div className="py-4 flex justify-between text-sm"><span>E-mail</span><span className="text-muted-foreground">{user?.email}</span></div>
            <div className="py-4 flex justify-between text-sm"><span>Notificações</span><span className="text-muted-foreground">Ativadas</span></div>
            <button className="w-full py-4 flex justify-between text-sm text-left" onClick={() => toast.info('Use Recuperar senha para alterar seu acesso')}><span>Alterar senha</span><span className="text-muted-foreground">→</span></button>
          </div>
          <Button variant="outline" className="mt-5" onClick={async () => { await supabase.auth.signOut(); window.location.assign('/login'); }}>Sair da conta</Button>
        </CardContent>
      </Card>
    </PersonaLayout>
  );
}