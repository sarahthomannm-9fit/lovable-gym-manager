import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Copy, KeyRound, RotateCcw, ShieldOff, Plug } from 'lucide-react';

type Connection = {
  id: string;
  api_key_prefix: string;
  status: string;
  last_sync_at: string | null;
  created_at: string;
};

type Event = {
  id: string;
  event_type: string;
  payload: any;
  created_at: string;
};

const ENDPOINTS = [
  { method: 'GET', path: '/v1/health', desc: 'Health check público' },
  { method: 'POST', path: '/v1/fitpro/connect', desc: 'Registrar conexão do FitPro' },
  { method: 'POST', path: '/v1/fitpro/sync', desc: 'Sincronizar dados' },
  { method: 'POST', path: '/v1/fitpro/student-context', desc: 'Contexto completo de um aluno' },
  { method: 'GET', path: '/v1/fitpro/students', desc: 'Listar alunos ativos' },
  { method: 'GET', path: '/v1/fitpro/classes', desc: 'Listar aulas futuras' },
  { method: 'POST', path: '/v1/fitpro/check-in', desc: 'Registrar check-in' },
  { method: 'GET', path: '/v1/fitpro/student-checkins', desc: 'Histórico de check-ins do aluno' },
];

export default function FitProIntegration() {
  const [conn, setConn] = useState<Connection | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);

  const fnBase = `https://jobytedbdptuncvobarw.supabase.co/functions/v1/fitmanager-api`;

  async function load() {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setLoading(false); return; }
    const { data: c } = await supabase
      .from('fitmanager_connections' as any)
      .select('id, api_key_prefix, status, last_sync_at, created_at')
      .eq('professor_id', user.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setConn((c as any) ?? null);

    if (c) {
      const { data: ev } = await supabase
        .from('fitmanager_events' as any)
        .select('id, event_type, payload, created_at')
        .eq('connection_id', (c as any).id)
        .order('created_at', { ascending: false })
        .limit(20);
      setEvents(((ev as any) ?? []) as Event[]);
    } else {
      setEvents([]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function callKey(action: 'generate' | 'rotate' | 'revoke') {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('fitmanager-api-key', { body: { action } });
      if (error) throw error;
      if ((data as any)?.api_key) {
        setRawKey((data as any).api_key);
        toast.success('API Key gerada. Copie agora — ela não será exibida novamente.');
      } else {
        toast.success('Operação concluída.');
      }
      await load();
    } catch (e: any) {
      toast.error('Falha: ' + (e?.message ?? 'erro'));
    } finally {
      setBusy(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <header className="flex items-center gap-3">
        <Plug className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Integração com FitPro</h1>
          <p className="text-sm text-muted-foreground">Conecte o FitPro ao FitManager via API Key segura.</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Sua API Key</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : conn ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <code className="px-3 py-1.5 rounded bg-muted text-sm font-mono">{conn.api_key_prefix}…••••••••</code>
                <Badge variant={conn.status === 'active' ? 'default' : 'destructive'}>{conn.status}</Badge>
                <span className="text-xs text-muted-foreground">
                  Último uso: {conn.last_sync_at ? new Date(conn.last_sync_at).toLocaleString('pt-BR') : 'nunca'}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => callKey('rotate')} disabled={busy}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Rotacionar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => callKey('revoke')} disabled={busy}>
                  <ShieldOff className="h-4 w-4 mr-1" /> Revogar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Nenhuma API Key ativa. Gere uma para iniciar a integração.</p>
              <Button onClick={() => callKey('generate')} disabled={busy}>
                <KeyRound className="h-4 w-4 mr-1" /> Gerar API Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Endpoints disponíveis</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Base URL:</p>
          <div className="flex items-center gap-2">
            <code className="px-2 py-1 rounded bg-muted text-xs font-mono break-all">{fnBase}</code>
            <Button size="sm" variant="ghost" onClick={() => copy(fnBase)}><Copy className="h-3 w-3" /></Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Autenticação: header <code>x-api-key: SUA_API_KEY</code></p>
          <div className="mt-4 divide-y divide-border border rounded-lg">
            {ENDPOINTS.map((e) => (
              <div key={e.path} className="flex items-center gap-3 px-3 py-2 text-sm">
                <Badge variant="outline" className="font-mono text-[10px]">{e.method}</Badge>
                <code className="font-mono text-xs">{e.path}</code>
                <span className="text-xs text-muted-foreground ml-auto">{e.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Últimos eventos</CardTitle></CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem eventos ainda. Eles aparecem aqui após o FitPro chamar a API.</p>
          ) : (
            <div className="divide-y divide-border">
              {events.map((e) => (
                <div key={e.id} className="py-2 flex items-center gap-3 text-sm">
                  <Badge variant="secondary" className="text-[10px]">{e.event_type}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString('pt-BR')}</span>
                  <code className="ml-auto text-[10px] text-muted-foreground truncate max-w-[40%]">{JSON.stringify(e.payload)}</code>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!rawKey} onOpenChange={(o) => !o && setRawKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sua nova API Key</DialogTitle>
            <DialogDescription>
              Copie agora. Por segurança, ela não será exibida novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded bg-muted text-xs font-mono break-all">{rawKey}</code>
            <Button size="sm" onClick={() => rawKey && copy(rawKey)}><Copy className="h-4 w-4" /></Button>
          </div>
          <Button className="mt-3" onClick={() => setRawKey(null)}>Já copiei</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
