import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Check = Database['public']['Functions']['fitness_delivery_readiness']['Returns'][number];

export function FitnessDeliveryReadiness({ orgId }: { orgId: string }) {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setChecks(null);
    setFailed(false);
    void supabase.rpc('fitness_delivery_readiness', { p_org: orgId }).then(({ data, error }) => {
      if (!active) return;
      setChecks(data);
      setFailed(Boolean(error));
    });
    return () => { active = false; };
  }, [orgId, revision]);

  return <Card>
    <CardHeader><CardTitle>Prontidão da Portaria Fitness</CardTitle></CardHeader>
    <CardContent className="space-y-3 text-sm">
      <p className="text-muted-foreground">Evidências registradas neste condomínio. A entrega exige homologação com morador, professor, síndico e admin.</p>
      {failed ? <p role="alert">Não foi possível consultar a prontidão.</p> : checks === null
        ? <p role="status">Consultando evidências…</p>
        : <ul className="divide-y">{checks.map(check => (
          <li key={check.criterio} className="flex flex-wrap justify-between gap-2 py-2">
            <div>
              <p className="font-medium">Fase {check.etapa} · {check.criterio}</p>
              <p className="text-muted-foreground">{check.proximo_passo}</p>
            </div>
            <Badge variant={check.quantidade > 0 ? 'default' : 'outline'}>{check.quantidade > 0 ? check.quantidade : 'Sem registro'}</Badge>
          </li>
        ))}</ul>}
      <Button variant="outline" disabled={checks === null && !failed} onClick={() => setRevision(value => value + 1)}>Atualizar evidências</Button>
    </CardContent>
  </Card>;
}
