import { PageShell } from '@/components/warroom/PageShell';
import { useDataIntegration } from '@/components/DataIntegrationProvider';
import { useBusinessEngine } from '@/hooks/useBusinessEngine';
import { useAutomationQueue } from '@/hooks/useAutomationQueue';
import { useActionExecutor } from '@/hooks/useActionExecutor';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, Ban, CheckCircle, Loader2 } from 'lucide-react';

const ETAPA_COLORS: Record<string, string> = {
  'Preventivo': 'bg-blue-500',
  'D+1 a D+3': 'bg-amber-500',
  'D+3 a D+7': 'bg-orange-500',
  'D+7 a D+15': 'bg-red-500',
  'D+15 a D+30': 'bg-red-700',
  'D+30+': 'bg-red-900',
};

export function Inadimplencia() {
  const { alunos, pagamentos, checkins, aulas, leads, experimentais } = useDataIntegration();
  const engine = useBusinessEngine({ alunos, pagamentos, checkins, aulas, leads, experimentais });
  const queue = useAutomationQueue({ pagamentos: engine.pagamentos, alunos: engine.alunos, leads: engine.leads });
  const { execute, executing, resolved } = useActionExecutor();

  const cobrancas = queue.items.filter(i => i.tipo === 'cobranca');
  const totalValor = cobrancas.reduce((s, c) => s + (c.valor || 0), 0);

  const shellMetrics = [
    { label: 'INADIMPLENTES', value: String(cobrancas.length), color: 'text-destructive' },
    { label: 'VALOR TOTAL', value: `R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: 'text-destructive' },
    { label: 'AUTO', value: String(cobrancas.filter(c => c.auto_executavel).length) },
    { label: 'HUMANO', value: String(cobrancas.filter(c => !c.auto_executavel).length), color: 'text-[hsl(var(--urgency-attention))]' },
  ];

  // Group by etapa
  const porEtapa = cobrancas.reduce((acc, c) => {
    (acc[c.etapa] = acc[c.etapa] || []).push(c);
    return acc;
  }, {} as Record<string, typeof cobrancas>);

  return (
    <PageShell title="INADIMPLÊNCIA" sub="Régua de cobrança por etapa" metrics={shellMetrics}>
      {cobrancas.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <p className="text-muted-foreground font-mono text-sm">Nenhum aluno inadimplente. 🎉</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(porEtapa).map(([etapa, items]) => (
            <div key={etapa}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${ETAPA_COLORS[etapa] || 'bg-muted'}`} />
                <h3 className="text-xs font-mono font-bold tracking-wider text-foreground">{etapa}</h3>
                <Badge variant="outline" className="text-[9px] font-mono">{items.length}</Badge>
              </div>
              <div className="grid gap-2">
                {items.map(item => {
                  const isExecuting = executing.has(item.id);
                  const isResolved = resolved.has(item.id);
                  return (
                    <Card key={item.id} className={`transition-all ${isResolved ? 'opacity-50 border-green-500/40' : ''}`}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.alvo}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.acao_sugerida}</p>
                        </div>
                        {item.valor && (
                          <span className="text-sm font-bold text-destructive shrink-0">
                            R$ {item.valor.toFixed(0)}
                          </span>
                        )}
                        <div className="flex gap-1 shrink-0">
                          {item.auto_executavel ? (
                            <Button size="sm" className="h-7 text-xs" disabled={isExecuting || isResolved} onClick={() => execute(item)}>
                              {isExecuting ? <Loader2 className="h-3 w-3 animate-spin" /> : isResolved ? <CheckCircle className="h-3 w-3" /> : <MessageSquare className="h-3 w-3 mr-1" />}
                              {isResolved ? 'Feito' : 'Cobrar'}
                            </Button>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => execute(item)} disabled={isExecuting || isResolved}>
                                {isExecuting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Phone className="h-3 w-3 mr-1" />}
                                Ligar
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => execute(item)} disabled={isExecuting || isResolved}>
                                Negociar
                              </Button>
                            </>
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