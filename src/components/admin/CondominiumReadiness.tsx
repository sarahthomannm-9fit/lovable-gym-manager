import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Check = { key: string; label: string; detail: string; count: number; passed: boolean };
type Readiness = { organization_id: string; as_of: string; ready_for_activation: boolean; checks: Check[] };

export function CondominiumReadiness({ orgId }: { orgId: string }) {
  const [snapshot, setSnapshot] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true); setSnapshot(null); setError('');
    void (async () => {
      try {
        const { data, error } = await (supabase as any).rpc('organization_operation_readiness', { p_org_id: orgId });
        if (error) throw error;
        if (!data || data.organization_id !== orgId || !Array.isArray(data.checks)) throw new Error('Resposta de preparação inválida.');
        if (current) setSnapshot(data);
      } catch { if (current) setError('Não foi possível consultar a preparação. A implantação precisa incluir a função de preparação operacional.'); }
      finally { if (current) setLoading(false); }
    })();
    return () => { current = false; };
  }, [orgId, revision]);
  return <Card><CardHeader><CardTitle>Entrega da promessa NINE LIVING</CardTitle></CardHeader><CardContent className="space-y-3">
    <p className="text-sm text-muted-foreground">Pré-requisitos reais do condomínio para a operação contratada. Esta lista não substitui sua aprovação funcional nem confirma publicação do aplicativo.</p>
    {loading ? <p role="status">Consultando pré-requisitos…</p> : error ? <p role="alert" className="text-destructive">{error}</p> : snapshot && <>
      <p className="font-medium">{snapshot.ready_for_activation ? 'Cadastros necessários preenchidos. A aprovação funcional permanece com o responsável.' : 'Operação incompleta: resolva as pendências abaixo.'}</p>
      <ul className="space-y-2">{snapshot.checks.map(check => <li key={check.key} className="flex flex-wrap justify-between gap-3 border-b py-2 text-sm"><div><span>{check.label}</span>{!check.passed && <p className="text-muted-foreground">{check.detail}</p>}</div><strong className={check.passed ? 'text-emerald-600' : 'text-amber-600'}>{check.passed ? 'Cadastrado' : 'Pendente'}</strong></li>)}</ul>
      <p className="text-xs text-muted-foreground">Consultado em {new Date(snapshot.as_of).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}. Cadastros podem mudar após esta consulta.</p>
    </>}
    <Button variant="outline" disabled={loading} onClick={() => setRevision(value => value + 1)}>Atualizar pendências</Button>
  </CardContent></Card>;
}
