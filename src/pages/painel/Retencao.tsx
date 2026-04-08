import { PageShell } from '@/components/warroom/PageShell';
import { useDataIntegration } from '@/components/DataIntegrationProvider';
import { useBusinessEngine } from '@/hooks/useBusinessEngine';
import { useAutomationQueue } from '@/hooks/useAutomationQueue';
import { useActionExecutor } from '@/hooks/useActionExecutor';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, CheckCircle, Loader2, UserX } from 'lucide-react';

const TIER_COLORS: Record<string, string> = {
  'Watchlist': 'border-l-amber-400',
  'Alerta médio': 'border-l-orange-500',
  'Alerta alto': 'border-l-red-500',
  'Crítico': 'border-l-red-800',
};

export function Retencao() {
  const { alunos, pagamentos, checkins, aulas, leads, experimentais } = useDataIntegration();
  const engine = useBusinessEngine({ alunos, pagamentos, checkins, aulas, leads, experimentais });
  const queue = useAutomationQueue({ pagamentos: engine.pagamentos, alunos: engine.alunos, leads: engine.leads });
  const { execute, executing, resolved } = useActionExecutor();

  const retencao = queue.items.filter(i => i.tipo === 'retencao');

  const porTier = retencao.reduce((acc, r) => {
    (acc[r.etapa] = acc[r.etapa] || []).push(r);
    return acc;
  }, {} as Record<string, typeof retencao>);

  const tiers = ['Watchlist', 'Alerta médio', 'Alerta alto', 'Crítico'];

  const shellMetrics = [
    { label: 'EM RISCO', value: String(retencao.length), color: 'text-[hsl(var(--urgency-attention))]' },
    ...Object.entries(queue.retencaoPorTier).map(([tier, count]) => ({
      label: tier.toUpperCase(), value: String(count),
    })),
  ];

  return (
    <PageShell title="RETENÇÃO" sub="Alunos sem frequência por tier de risco" metrics={shellMetrics}>
      {retencao.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <p className="text-muted-foreground font-mono text-sm">Todos os alunos frequentando normalmente.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {tiers.filter(t => porTier[t]?.length).map(tier => (
            <div key={tier}>
              <h3 className="text-xs font-mono font-bold tracking-wider text-foreground mb-3 flex items-center gap-2">
                <UserX className="h-3.5 w-3.5" />
                {tier}
                <Badge variant="outline" className="text-[9px] font-mono">{porTier[tier].length}</Badge>
              </h3>
              <div className="grid gap-2">
                {porTier[tier].map(item => {
                  const isExecuting = executing.has(item.id);
                  const isResolved = resolved.has(item.id);
                  const aluno = engine.alunos.find(a => a.id === item.alvo_id);
                  return (
                    <Card key={item.id} className={`border-l-4 ${TIER_COLORS[tier] || ''} ${isResolved ? 'opacity-50' : ''}`}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.alvo}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {aluno ? `${aluno.diasSemCheckin}d sem check-in` : item.acao_sugerida}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => execute(item)} disabled={isExecuting || isResolved}>
                            {isExecuting ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3 mr-1" />}
                            Mensagem
                          </Button>
                          {!item.auto_executavel && (
                            <Button size="sm" className="h-7 text-xs" onClick={() => execute(item)} disabled={isExecuting || isResolved}>
                              <Phone className="h-3 w-3 mr-1" />
                              Ligar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}