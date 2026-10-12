import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PrescriptionAudit() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { const { data } = await (supabase as any).from('prescription_audit_log').select('id, treino_id, organization_id, actor_user_id, action, details, created_at').order('created_at', { ascending: false }).limit(100); setRows(data || []); setLoading(false); })(); }, []);
  return <div className="min-h-full bg-background p-6 space-y-6"><div><p className="text-[10px] font-mono tracking-[0.18em] uppercase text-primary/70">NINE LIVING · CONTROLE</p><h1 className="font-display text-3xl font-normal">Histórico de prescrição</h1><p className="text-sm text-muted-foreground">Registro das publicações de treino e responsável pela ação.</p></div><Card className="rounded-sm shadow-elegant"><CardHeader><CardTitle>Últimas ações</CardTitle></CardHeader><CardContent>{loading ? <p className="text-sm text-muted-foreground">Carregando histórico...</p> : !rows.length ? <p className="text-sm text-muted-foreground">Nenhuma publicação registrada.</p> : <div className="space-y-3">{rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3 text-sm"><div><p className="font-medium">{row.action}</p><p className="text-xs text-muted-foreground">Treino {row.treino_id || '—'} · responsável {row.actor_user_id || '—'}</p></div><Badge variant="outline">{new Date(row.created_at).toLocaleString('pt-BR')}</Badge></div>)}</div>}</CardContent></Card></div>;
}
