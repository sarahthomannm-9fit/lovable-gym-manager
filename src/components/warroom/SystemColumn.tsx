import { SmartAlert } from '@/hooks/useSmartAlerts';
import { CrossMetrics } from '@/hooks/useCrossMetrics';
import { ActionCard } from './ActionCard';
import { SecHead } from './SecHead';
import { ProgBar } from './ProgBar';
import { useNavigate } from 'react-router-dom';

interface SystemColumnProps {
  metrics: CrossMetrics;
  alerts: SmartAlert[];
}

export function SystemColumn({ metrics, alerts }: SystemColumnProps) {
  const navigate = useNavigate();
  const systemAlerts = alerts.filter(a => a.coluna === 'sistema').slice(0, 5);

  const fmtR = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  const automations = [
    { label: 'Régua de cobrança', count: `${metrics.inadimplencia} alunos`, active: metrics.inadimplencia > 0 },
    { label: 'Alertas frequência', count: `watchlist: ${metrics.alunosInativos}`, active: metrics.alunosInativos > 0 },
    { label: 'Renovações prevent.', count: `${metrics.assinaturasVencendo} próximos`, active: metrics.assinaturasVencendo > 0 },
    { label: 'Confirmação aulas', count: `${metrics.aulasHoje} hoje`, active: metrics.aulasHoje > 0 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-0.5">
        <div className="text-[9px] font-mono tracking-[0.12em] text-muted-foreground font-bold">
          ◎ SISTEMA OPERANDO
        </div>
        <div className="w-2 h-2 rounded-full bg-urgency-opportunity ml-auto animate-pulse" />
      </div>

      {/* Automações Ativas */}
      <div className="bg-card border border-border rounded-md p-4">
        <SecHead title="AUTOMAÇÕES ATIVAS" />
        {automations.map((a, i) => (
          <div key={i} className="border-t border-border py-2 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.active ? 'bg-urgency-opportunity' : 'bg-muted-foreground'}`} />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-navy">{a.label}</div>
              <div className="text-[10px] font-mono text-muted-foreground">{a.count}</div>
            </div>
            <span className={`text-[9px] font-mono tracking-wider ${a.active ? 'text-urgency-opportunity' : 'text-muted-foreground'}`}>
              {a.active ? 'ATIVO' : 'IDLE'}
            </span>
          </div>
        ))}
      </div>

      {/* Projeção */}
      <div className="bg-card border border-border rounded-md p-4">
        <SecHead title="PROJEÇÃO PRÓXIMO MÊS" />
        {[
          { label: 'MRR confirmado', value: fmtR(metrics.receitaMensal * 0.75), p: 75, color: 'bg-urgency-opportunity' },
          { label: 'MRR em risco', value: fmtR(metrics.totalInadimplente), p: Math.min(Math.round((metrics.totalInadimplente / Math.max(metrics.receitaMensal, 1)) * 100), 100), color: 'bg-urgency-critical' },
          { label: 'Novos (conv.)', value: fmtR(metrics.ticketMedio * metrics.leadsConvertidos), p: Math.min(Math.round((metrics.leadsConvertidos / Math.max(metrics.leadsTotal, 1)) * 100), 100), color: 'bg-urgency-info' },
        ].map((m, i) => (
          <div key={i} className="border-t border-border py-2">
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-muted-foreground font-mono">{m.label}</span>
              <span className={`text-[11px] font-mono font-semibold`}>{m.value}</span>
            </div>
            <ProgBar value={m.p} max={100} color={m.color} />
          </div>
        ))}
      </div>

      {/* Agente IA card */}
      <div className="bg-urgency-info-bg border border-urgency-info-border rounded-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[10px] font-mono text-primary font-bold tracking-wider">AGENTE IA · ONLINE</span>
        </div>
        {[
          metrics.churnRisk.length > 0 ? `${metrics.churnRisk.length} aluno(s) em risco de churn` : null,
          metrics.leadsSemFollowup > 0 ? `${metrics.leadsSemFollowup} lead(s) sem follow-up` : null,
          metrics.alunosComTreinoVencido > 0 ? `${metrics.alunosComTreinoVencido} treino(s) vencido(s)` : null,
        ].filter(Boolean).map((s, i) => (
          <div key={i} className="border-t border-urgency-info-border py-1.5 text-[11px] text-navy-mid leading-relaxed">
            <span className="text-primary mr-1.5">→</span>{s}
          </div>
        ))}
        <button
          onClick={() => navigate('/agente-ia')}
          className="mt-2.5 w-full py-2 bg-primary border-none text-primary-foreground text-[11px] font-mono cursor-pointer rounded font-semibold hover:opacity-85 transition-opacity"
        >
          ABRIR AGENTE →
        </button>
      </div>

      {/* System alerts */}
      {systemAlerts.length > 0 && (
        <div className="space-y-2">
          {systemAlerts.map(alert => (
            <ActionCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
