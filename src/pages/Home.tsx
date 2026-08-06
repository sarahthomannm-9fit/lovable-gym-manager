import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import {
  KpiCard, SectionHeader, QuickActions, AIAdvisor, DashboardSkeleton, DashboardError, DashboardEmpty,
  type Insight,
} from '@/components/dashboard/DashboardKit';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, UserCheck, Calendar, DollarSign, RefreshCw, ClipboardList,
  UserPlus, Megaphone, BarChart3, Activity, AlertTriangle,
} from 'lucide-react';

type Resumo = {
  alunosAtivos: number;
  checkinsHoje: number;
  aulasHoje: number;
  receitaMes: number;
  avaliacoesPendentes: number;
  pagamentosAtrasados: number;
  notificacoes: number;
};

const VAZIO: Resumo = {
  alunosAtivos: 0, checkinsHoje: 0, aulasHoje: 0, receitaMes: 0,
  avaliacoesPendentes: 0, pagamentosAtrasados: 0, notificacoes: 0,
};

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useCurrentUserRole();
  const { activeOrg, memberships, isAdmin, loading: ctxLoading } = useOperationalContext();
  const [resumo, setResumo] = useState<Resumo>(VAZIO);
  const [atividades, setAtividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nome = useMemo(() => {
    const meta = (user?.user_metadata as any)?.nome as string | undefined;
    return (meta || user?.email?.split('@')[0] || 'operador').split(' ')[0];
  }, [user]);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().slice(0, 10);

      let alunosQuery = supabase.from('alunos').select('id, status, organization_id');
      if (activeOrg && !isAdmin) alunosQuery = alunosQuery.eq('organization_id', activeOrg.id);
      const { data: alunos, error: e1 } = await alunosQuery;
      if (e1) throw e1;
      const ids = (alunos || []).map((a: any) => a.id);

      const [checkins, aulas, pagos, atrasados, avaliacoes, notif, eventos] = await Promise.all([
        supabase.from('checkins').select('id', { count: 'exact', head: true }).eq('data_checkin', hoje),
        supabase.from('aulas').select('id', { count: 'exact', head: true }).eq('data_aula', hoje),
        supabase.from('pagamentos').select('valor').eq('status', 'pago').gte('data_pagamento', inicioMes),
        supabase.from('pagamentos').select('id', { count: 'exact', head: true })
          .eq('status', 'pendente').lt('data_vencimento', hoje),
        supabase.from('avaliacoes_fisicas').select('id', { count: 'exact', head: true })
          .lte('proxima_avaliacao', hoje),
        supabase.from('notificacoes').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('system_events').select('event_type, entity_type, created_at, metadata')
          .order('created_at', { ascending: false }).limit(8),
      ]);

      setResumo({
        alunosAtivos: (alunos || []).filter((a: any) => a.status === 'ativo').length || ids.length,
        checkinsHoje: checkins.count || 0,
        aulasHoje: aulas.count || 0,
        receitaMes: (pagos.data || []).reduce((s: number, p: any) => s + Number(p.valor || 0), 0),
        pagamentosAtrasados: atrasados.count || 0,
        avaliacoesPendentes: avaliacoes.count || 0,
        notificacoes: notif.count || 0,
      });
      setAtividades(eventos.data || []);
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar o resumo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!ctxLoading) carregar(); /* eslint-disable-next-line */ }, [activeOrg?.id, ctxLoading]);

  const insights: Insight[] = useMemo(() => {
    const out: Insight[] = [];
    if (resumo.avaliacoesPendentes > 0) out.push({
      text: `Você possui ${resumo.avaliacoesPendentes} avaliação(ões) física(s) pendente(s). Deseja concluí-las agora?`,
      tone: 'warning', actionLabel: 'Abrir avaliações', onAction: () => navigate('/avaliacoes'),
    });
    if (resumo.pagamentosAtrasados > 0) out.push({
      text: `${resumo.pagamentosAtrasados} pagamento(s) em atraso impactam a receita deste mês.`,
      tone: 'warning', actionLabel: 'Ver cobranças', onAction: () => navigate('/relatorios/cobrancas'),
    });
    if (resumo.checkinsHoje === 0 && resumo.alunosAtivos > 0) out.push({
      text: 'Nenhum check-in registrado hoje — vale disparar um comunicado de engajamento.',
      tone: 'info', actionLabel: 'Criar comunicado', onAction: () => navigate('/marketing/comunicacao'),
    });
    if (resumo.receitaMes > 0 && out.length === 0) out.push({
      text: `Operação saudável: R$ ${resumo.receitaMes.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} recebidos no mês, sem alertas críticos.`,
      tone: 'positive', actionLabel: 'Ver relatórios', onAction: () => navigate('/relatorios'),
    });
    return out;
  }, [resumo, navigate]);

  const acoes = [
    { label: 'Novo aluno', icon: UserPlus, onClick: () => navigate('/alunos') },
    { label: 'Nova aula', icon: Calendar, onClick: () => navigate('/aulas') },
    { label: 'Avaliação', icon: Activity, onClick: () => navigate('/avaliacoes') },
    { label: 'Comunicado', icon: Megaphone, onClick: () => navigate('/marketing/comunicacao') },
    { label: 'Relatórios', icon: BarChart3, onClick: () => navigate('/relatorios') },
  ];

  const personas = [
    { label: 'Síndico', path: '/sindico', desc: 'Condomínios' },
    { label: 'Coach', path: '/coach', desc: 'Assessoria esportiva' },
    { label: 'Corporativo', path: '/corp', desc: 'Empresas' },
    { label: 'Morador', path: '/morador', desc: 'Aluno' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold font-display">{saudacao()}, {nome}.</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeOrg ? `Operação de ${activeOrg.nome}` : 'Visão consolidada 9FIT'} ·{' '}
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {role && <Badge variant="secondary" className="text-[10px] uppercase">{role}</Badge>}
          <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </header>

      {loading ? (
        <DashboardSkeleton cards={6} />
      ) : error ? (
        <DashboardError message={error} onRetry={carregar} />
      ) : (
        <>
          <section>
            <SectionHeader title="Hoje sua operação possui" description="Indicadores consolidados do dia" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard label="Alunos ativos" value={resumo.alunosAtivos} icon={Users} onClick={() => navigate('/alunos')} />
              <KpiCard label="Check-ins hoje" value={resumo.checkinsHoje} icon={UserCheck} onClick={() => navigate('/checkin')} />
              <KpiCard label="Aulas hoje" value={resumo.aulasHoje} icon={Calendar} onClick={() => navigate('/aulas')} />
              <KpiCard
                label="Receita do mês"
                value={`R$ ${resumo.receitaMes.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                icon={DollarSign} onClick={() => navigate('/relatorios')}
              />
              <KpiCard label="Avaliações pendentes" value={resumo.avaliacoesPendentes}
                       tone={resumo.avaliacoesPendentes ? 'warning' : 'default'}
                       icon={ClipboardList} onClick={() => navigate('/avaliacoes')} />
              <KpiCard label="Pagamentos em atraso" value={resumo.pagamentosAtrasados}
                       tone={resumo.pagamentosAtrasados ? 'critical' : 'default'}
                       icon={AlertTriangle} onClick={() => navigate('/relatorios/cobrancas')} />
              <KpiCard label="Notificações" value={resumo.notificacoes} icon={Megaphone} />
              <KpiCard label="Organizações" value={memberships.length || 1} icon={BarChart3}
                       onClick={() => navigate('/admin/organizacoes')} />
            </div>
          </section>

          <AIAdvisor insights={insights} />

          <section>
            <SectionHeader title="Ações rápidas" description="O próximo passo, sem procurar no menu" />
            <QuickActions actions={acoes} />
          </section>

          <section className="grid lg:grid-cols-2 gap-4">
            <div>
              <SectionHeader title="Meus contextos" description="Troque de persona sem sair da sessão" />
              <div className="grid sm:grid-cols-2 gap-3">
                {personas.map((p) => (
                  <Card key={p.path} className="bg-card/60 border-border/40 cursor-pointer hover:border-primary/40 transition-colors"
                        onClick={() => navigate(p.path)}>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <SectionHeader title="Atividade recente" description="Últimos eventos registrados no sistema" />
              {atividades.length === 0 ? (
                <DashboardEmpty title="Sem atividade recente" message="Os eventos aparecem aqui conforme a operação acontece." />
              ) : (
                <Card className="bg-card/60 border-border/40">
                  <CardContent className="p-0 divide-y divide-border/30">
                    {atividades.map((e, i) => (
                      <div key={i} className="px-4 py-2.5 flex items-center justify-between gap-3">
                        <span className="text-xs">{e.event_type} · {e.entity_type}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {new Date(e.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
