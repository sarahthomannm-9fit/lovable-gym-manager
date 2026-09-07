import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const accept = async () => { if (!token) return; setLoading(true); const { error } = await (supabase as any).rpc('accept_organization_invite', { p_token: token }); setLoading(false); if (error) toast.error(error.message); else { toast.success('Convite aceito.'); navigate('/select-context'); } };
  return <div className="min-h-screen bg-background flex items-center justify-center p-4"><Card className="w-full max-w-md rounded-sm shadow-elegant"><CardHeader><p className="text-[10px] font-mono tracking-[0.18em] uppercase text-primary/70">NINE LIVING</p><CardTitle className="font-display text-2xl font-normal">Aceitar convite</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Aceite este convite para acessar o condomínio e a função operacional atribuída.</p><Button className="w-full" onClick={accept} disabled={loading}>{loading ? 'Vinculando…' : 'Aceitar convite'}</Button></CardContent></Card></div>;
}
