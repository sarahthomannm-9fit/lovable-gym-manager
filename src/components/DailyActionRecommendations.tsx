import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDataIntegration } from '@/components/DataIntegrationProvider';
import { useNavigate } from 'react-router-dom';
import {
  Zap, DollarSign, Users, MessageSquare, Dumbbell,
  CalendarCheck, TrendingUp, UserPlus, AlertTriangle,
  Star, Clock, Target, Heart, Megaphone, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyAction {
  id: string;
  categoria: 'caixa' | 'conteudo' | 'gestao';
  prioridade: 'alta' | 'media' | 'baixa';
  titulo: string;
  impacto: string;
  rota: string;
  icon: any;
}

const CAT_COLORS = {
  caixa: 'bg-[hsl(var(--urgency-opportunity))]/10 border-[hsl(var(--urgency-opportunity))]/30 text-[hsl(var(--urgency-opportunity))]',
  gestao: 'bg-[hsl(var(--urgency-info))]/10 border-[hsl(var(--urgency-info))]/30 text-[hsl(var(--urgency-info))]',
  conteudo: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
};

export function DailyActionRecommendations() {
  const navigate = useNavigate();
  const { metrics, campanhas } = useDataIntegration();

  const actions = useMemo<DailyAction[]>(() => {
    if (!metrics) return [];
    const list: DailyAction[] = [];
    const diaSemana = new Date().getDay();

    if (metrics.totalInadimplente > 0) {
      list.push({ id: 'cobrar', categoria: 'caixa', prioridade: metrics.totalInadimplente > 500 ? 'alta' : 'media', titulo: `Cobrar ${metrics.inadimplencia} vencido(s)`, impacto: `+R$ ${metrics.totalInadimplente.toLocaleString('pt-BR')}`, rota: '/pagamentos', icon: DollarSign });
    }
    if (metrics.experimentaisAgendadas > 0) {
      list.push({ id: 'converter', categoria: 'caixa', prioridade: 'alta', titulo: `Converter ${metrics.experimentaisAgendadas} experimental(is)`, impacto: `${metrics.taxaConversaoExperimental.toFixed(0)}% conversão`, rota: '/experimentais', icon: UserPlus });
    }
    if (metrics.alunosInativos > 0) {
      list.push({ id: 'reativar', categoria: 'gestao', prioridade: metrics.alunosInativos > 3 ? 'alta' : 'media', titulo: `Contatar ${metrics.alunosInativos} sem frequência`, impacto: `Evitar ${metrics.alunosInativos} cancel.`, rota: '/alunos', icon: Heart });
    }
    if (metrics.alunosComTreinoVencido > 0) {
      list.push({ id: 'treinos', categoria: 'gestao', prioridade: 'media', titulo: `Renovar ${metrics.alunosComTreinoVencido} treino(s)`, impacto: 'Retenção', rota: '/treinos', icon: Dumbbell });
    }
    const churnAlto = metrics.churnRisk.filter(c => c.motivos.length >= 2);
    if (churnAlto.length > 0) {
      list.push({ id: 'churn', categoria: 'gestao', prioridade: 'alta', titulo: `${churnAlto.length} aluno(s) alto risco`, impacto: 'Retenção crítica', rota: '/alunos', icon: AlertTriangle });
    }
    if (diaSemana === 1) {
      list.push({ id: 'conteudo', categoria: 'conteudo', prioridade: 'media', titulo: 'Planejar conteúdo da semana', impacto: 'Consistência', rota: '/marketing/comunicacao', icon: MessageSquare });
    }
    const semConversao = (campanhas || []).filter((c: any) => c.status === 'ativa' && (!c.conversoes || c.conversoes === 0));
    if (semConversao.length > 0) {
      list.push({ id: 'camp', categoria: 'conteudo', prioridade: 'media', titulo: `Otimizar ${semConversao.length} campanha(s)`, impacto: 'Melhorar ROI', rota: '/marketing/campanhas', icon: Megaphone });
    }

    return list.sort((a, b) => ({ alta: 0, media: 1, baixa: 2 }[a.prioridade] - { alta: 0, media: 1, baixa: 2 }[b.prioridade]));
  }, [metrics, campanhas]);

  if (actions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground">
          Ações do dia
        </span>
        <Badge variant="outline" className="text-[9px] h-4 px-1.5 ml-auto font-mono">
          {actions.filter(a => a.prioridade === 'alta').length} urgentes
        </Badge>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {actions.slice(0, 8).map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => navigate(action.rota)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md border text-left shrink-0 transition-all hover:scale-[1.02] cursor-pointer',
                CAT_COLORS[action.categoria]
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium truncate max-w-[140px]">{action.titulo}</p>
                <p className="text-[9px] opacity-70 font-mono">{action.impacto}</p>
              </div>
              {action.prioridade === 'alta' && (
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--urgency-critical))] shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
