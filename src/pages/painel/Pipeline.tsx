import { PageShell } from '@/components/warroom/PageShell';
import { useDataIntegration } from '@/components/DataIntegrationProvider';
import { useBusinessEngine } from '@/hooks/useBusinessEngine';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Thermometer, Snowflake, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

const ETAPAS = [
  { key: 'captado', label: 'Captado', color: 'border-t-blue-500' },
  { key: 'agendado', label: 'Agendado', color: 'border-t-cyan-500' },
  { key: 'experimental_feito', label: 'Experimental', color: 'border-t-amber-500' },
  { key: 'proposta_enviada', label: 'Proposta', color: 'border-t-orange-500' },
  { key: 'convertido', label: 'Convertido', color: 'border-t-green-500' },
];

const TEMP_ICON: Record<string, any> = { quente: Flame, morno: Thermometer, frio: Snowflake };
const TEMP_COLOR: Record<string, string> = { quente: 'text-red-500', morno: 'text-amber-500', frio: 'text-blue-400' };

export function Pipeline() {
  const { alunos, pagamentos, checkins, aulas, leads, experimentais } = useDataIntegration();
  const engine = useBusinessEngine({ alunos, pagamentos, checkins, aulas, leads, experimentais });
  const [acting, setActing] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  const contatar = async (lead: any) => {
    setActing(lead.id);
    const { error } = await supabase.from('mensagens_marketing').insert({
      canal: 'whatsapp',
      titulo: `Contato comercial - ${lead.nome}`,
      corpo: `Abordagem inicial para lead ${lead.temperatura}`,
      destinatarios: 1,
      status: 'agendada',
    });
    if (!error) {
      await supabase.from('leads').update({ status: 'contatado' }).eq('id', lead.id);
      setDone(s => new Set(s).add(lead.id));
      toast.success(`Contato com ${lead.nome} registrado`);
    } else toast.error('Falha ao registrar');
    setActing(null);
  };

  const porEtapa = ETAPAS.map(etapa => ({
    ...etapa,
    leads: engine.leads.filter(l => l.estado === etapa.key),
  }));

  const shellMetrics = [
    { label: 'TOTAL LEADS', value: String(engine.leads.length) },
    { label: 'QUENTES', value: String(engine.leads.filter(l => l.temperatura === 'quente').length), color: 'text-red-500' },
    { label: 'CONVERTIDOS', value: String(engine.leads.filter(l => l.estado === 'convertido').length), color: 'text-[hsl(var(--urgency-opportunity))]' },
    { label: 'OPORTUNIDADES', value: String(engine.oportunidades) },
  ];

  return (
    <PageShell title="PIPELINE CRM" sub="Funil de conversão Lead → Aluno" metrics={shellMetrics}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {porEtapa.map(etapa => (
          <div key={etapa.key} className="space-y-2">
            <div className={`border-t-4 ${etapa.color} bg-card rounded-t-md px-3 py-2`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono font-bold tracking-wider">{etapa.label}</p>
                <Badge variant="outline" className="text-[9px] font-mono">{etapa.leads.length}</Badge>
              </div>
            </div>
            <div className="space-y-1.5 min-h-[120px]">
              {etapa.leads.length === 0 ? (
                <p className="text-[9px] text-muted-foreground font-mono text-center py-4">—</p>
              ) : (
                etapa.leads.map(lead => {
                  const TempIcon = TEMP_ICON[lead.temperatura] || Snowflake;
                  const isActing = acting === lead.id;
                  const isDone = done.has(lead.id);
                  return (
                    <Card key={lead.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TempIcon className={`h-3 w-3 ${TEMP_COLOR[lead.temperatura]}`} />
                          <p className="text-xs font-medium truncate flex-1">{lead.nome}</p>
                        </div>
                        <p className="text-[9px] text-muted-foreground font-mono mb-1.5">
                          {lead.diasSemContato}d sem contato
                        </p>
                        {etapa.key !== 'convertido' && (
                          <Button size="sm" variant="outline" className="h-6 text-[10px] w-full"
                                  disabled={isActing || isDone}
                                  onClick={() => contatar(lead)}>
                            {isActing ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <MessageSquare className="h-2.5 w-2.5 mr-1" />}
                            {isDone ? 'Contatado' : 'Contatar'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
