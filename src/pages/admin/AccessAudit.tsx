import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AccessAudit() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { const { data } = await (supabase as any).from('user_access_audit').select('id,user_id,organization_id,event,metadata,created_at').order('created_at', { ascending: false }).limit(100); setRows(data || []); setLoading(false); })(); }, []);
  return <div className="min-h-full bg-background p-6 space-y-6"><div><p className="text-[10px] font-mono tracking-[0.18em] uppercase text-primary/70">NINE LIVING · SEGURANÇA</p><h1 className="font-display text-3xl font-normal">Acessos e atividade</h1><p className="text-sm text-muted-foreground">Monitore acessos recentes e eventos de segurança.</p></div><Card className="rounded-sm shadow-elegant"><CardHeader><CardTitle>Eventos recentes</CardTitle></CardHeader><CardContent>{loading ? <p className="text-sm text-muted-foreground">Carregando acessos...</p> : !rows.length ? <p className="text-sm text-muted-foreground">Nenhum acesso registrado.</p> : <div className="space-y-3">{rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3 text-sm"><div><p className="font-medium">{row.event}</p><p className="text-xs text-muted-foreground">Usuário {row.user_id} · Organização {row.organization_id || '—'}</p></div><Badge variant="outline">{new Date(row.created_at).toLocaleString('pt-BR')}</Badge></div>)}</div>}</CardContent></Card></div>;
}
