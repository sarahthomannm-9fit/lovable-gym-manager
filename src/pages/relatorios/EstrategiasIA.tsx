import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAdvancedFinancial } from "@/hooks/useSupabaseAdvancedFinancial";
import { useSupabaseFinancialReports } from "@/hooks/useSupabaseFinancialReports";
import { Brain, TrendingUp, AlertTriangle, Target, CheckCircle, ArrowRight, DollarSign, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";

interface EstrategiaIA {
  id: string;
  tipo: 'fluxo_caixa' | 'ticket_medio' | 'retencao' | 'captacao';
  titulo: string;
  descricao: string;
  impacto_estimado: number;
  probabilidade_sucesso: number;
  investimento_necessario: number;
  prazo_retorno: string;
  acoes_sugeridas: string[];
  status: 'sugerida' | 'implementando' | 'implementada' | 'pausada';
  data_criacao: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

interface AlunoRisco {
  id: string;
  nome: string;
  score_risco: number;
  motivos: string[];
  ultima_atividade: string;
  valor_mensal: number;
  tempo_como_aluno: number;
  recomendacoes: string[];
}

export function EstrategiasIA() {
  const [estrategias, setEstrategias] = useState<EstrategiaIA[]>([]);
  const [alunosRisco, setAlunosRisco] = useState<AlunoRisco[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const { 
    analiseAvancada, 
    projecoesCenarios, 
    loading: advancedLoading 
  } = useSupabaseAdvancedFinancial();
  
  const { 
    metricasGerais, 
    inadimplencia,
    loading: financialLoading 
  } = useSupabaseFinancialReports();

  // Dados simulados para estratégias IA
  const estrategiasDemo: EstrategiaIA[] = [
    {
      id: '1',
      tipo: 'ticket_medio',
      titulo: 'Programa de Upselling Inteligente',
      descricao: 'Identificar alunos do plano básico com alta frequência para ofertar upgrade para Premium',
      impacto_estimado: 2500,
      probabilidade_sucesso: 75,
      investimento_necessario: 500,
      prazo_retorno: '2-3 meses',
      acoes_sugeridas: [
        'Analisar frequência semanal dos alunos básicos',
        'Criar campanha personalizada para top 20%',
        'Oferecer desconto progressivo baseado em uso',
        'Implementar notificações in-app'
      ],
      status: 'sugerida',
      data_criacao: '2024-01-20',
      prioridade: 'alta'
    },
    {
      id: '2',
      tipo: 'retencao',
      titulo: 'Sistema de Alerta Preventivo',
      descricao: 'Detectar padrões de comportamento que indicam possível cancelamento',
      impacto_estimado: 3200,
      probabilidade_sucesso: 85,
      investimento_necessario: 800,
      prazo_retorno: '1-2 meses',
      acoes_sugeridas: [
        'Monitorar frequência de check-ins',
        'Acompanhar engajamento em aulas',
        'Disparar alertas automáticos para equipe',
        'Criar programa de reengajamento'
      ],
      status: 'implementando',
      data_criacao: '2024-01-15',
      prioridade: 'alta'
    },
    {
      id: '3',
      tipo: 'fluxo_caixa',
      titulo: 'Otimização de Datas de Vencimento',
      descricao: 'Redistribuir vencimentos para equilibrar fluxo de caixa mensal',
      impacto_estimado: 1800,
      probabilidade_sucesso: 90,
      investimento_necessario: 200,
      prazo_retorno: '1 mês',
      acoes_sugeridas: [
        'Analisar concentração atual de vencimentos',
        'Propor redistribuição para alunos flexíveis',
        'Implementar incentivos para mudança',
        'Monitorar impacto no fluxo'
      ],
      status: 'sugerida',
      data_criacao: '2024-01-18',
      prioridade: 'media'
    }
  ];

  const alunosRiscoDemo: AlunoRisco[] = [
    {
      id: '1',
      nome: 'Maria Silva',
      score_risco: 85,
      motivos: ['Frequência baixa (2x/semana)', 'Sem check-in há 5 dias', 'Não participa de aulas'],
      ultima_atividade: '2024-01-15',
      valor_mensal: 150,
      tempo_como_aluno: 8,
      recomendacoes: ['Ligar para verificar satisfação', 'Oferecer Personal gratuito', 'Convidar para aula experimental']
    },
    {
      id: '2',
      nome: 'João Santos',
      score_risco: 72,
      motivos: ['Atraso no pagamento', 'Reclamações recentes', 'Uso apenas em horários de pico'],
      ultima_atividade: '2024-01-18',
      valor_mensal: 120,
      tempo_como_aluno: 4,
      recomendacoes: ['Negociar desconto', 'Oferecer horários alternativos', 'Agendar conversa presencial']
    },
    {
      id: '3',
      nome: 'Ana Costa',
      score_risco: 68,
      motivos: ['Diminuição gradual de frequência', 'Não renovação automática'],
      ultima_atividade: '2024-01-19',
      valor_mensal: 200,
      tempo_como_aluno: 12,
      recomendacoes: ['Pesquisa de satisfação', 'Oferecer novos serviços', 'Programa de fidelidade']
    }
  ];

  useEffect(() => {
    // Simular carregamento dos dados
    setTimeout(() => {
      setEstrategias(estrategiasDemo);
      setAlunosRisco(alunosRiscoDemo);
      setLoading(false);
    }, 1000);
  }, []);

  const handleImplementarEstrategia = (id: string) => {
    setEstrategias(estrategias.map(e => 
      e.id === id ? { ...e, status: 'implementando' as const } : e
    ));
    toast({
      title: "Estratégia Implementada",
      description: "A estratégia foi marcada como em implementação!",
    });
  };

  const handleContatarAluno = (alunoId: string) => {
    toast({
      title: "Ação Registrada",
      description: "Contato com o aluno foi registrado no sistema!",
    });
  };

  // Dados para gráficos baseados na análise avançada
  const dadosFluxoCaixa = analiseAvancada?.map(item => ({
    periodo: item.periodo,
    receita_atual: item.receita_atual,
    receita_projetada: item.receita_projetada,
    variabilidade: item.variabilidade
  })) || [];

  const totalImpactoEstimado = estrategias.reduce((total, e) => total + e.impacto_estimado, 0);
  const estrategiasAlta = estrategias.filter(e => e.prioridade === 'alta').length;

  if (loading || advancedLoading || financialLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estratégias & IA</h1>
          <p className="text-muted-foreground">Carregando análises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            Estratégias & IA Financeira
          </h1>
          <p className="text-muted-foreground">
            Análises inteligentes e recomendações para otimização financeira
          </p>
        </div>
      </div>

      {/* Resumo de IA */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impacto Total Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalImpactoEstimado.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Potencial de receita adicional
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estratégias Ativas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estrategias.filter(e => e.status !== 'pausada').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {estrategiasAlta} de alta prioridade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos em Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alunosRisco.filter(a => a.score_risco > 70).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio Atual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(metricasGerais?.ticket_medio || 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Meta: R$ 180 (+20%)
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="estrategias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="estrategias">Estratégias IA</TabsTrigger>
          <TabsTrigger value="fluxo-caixa">Análise Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="retencao">Prevenção de Cancelamentos</TabsTrigger>
          <TabsTrigger value="projecoes">Projeções & Cenários</TabsTrigger>
        </TabsList>

        <TabsContent value="estrategias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estratégias Recomendadas pela IA</CardTitle>
              <CardDescription>Sugestões inteligentes para otimização financeira</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {estrategias.map((estrategia) => (
                  <div key={estrategia.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{estrategia.titulo}</h3>
                          <Badge variant={
                            estrategia.prioridade === 'alta' ? 'destructive' :
                            estrategia.prioridade === 'media' ? 'default' : 'secondary'
                          }>
                            {estrategia.prioridade} prioridade
                          </Badge>
                          <Badge variant={
                            estrategia.status === 'implementada' ? 'default' :
                            estrategia.status === 'implementando' ? 'secondary' : 'outline'
                          }>
                            {estrategia.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{estrategia.descricao}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium">Impacto Estimado:</span>
                            <span className="text-green-600 ml-1">R$ {estrategia.impacto_estimado.toLocaleString('pt-BR')}</span>
                          </div>
                          <div>
                            <span className="font-medium">Probabilidade:</span>
                            <span className="ml-1">{estrategia.probabilidade_sucesso}%</span>
                          </div>
                          <div>
                            <span className="font-medium">Investimento:</span>
                            <span className="ml-1">R$ {estrategia.investimento_necessario.toLocaleString('pt-BR')}</span>
                          </div>
                          <div>
                            <span className="font-medium">Retorno:</span>
                            <span className="ml-1">{estrategia.prazo_retorno}</span>
                          </div>
                        </div>

                        <div>
                          <p className="font-medium text-sm mb-2">Ações Sugeridas:</p>
                          <ul className="text-sm space-y-1">
                            {estrategia.acoes_sugeridas.map((acao, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                {acao}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {estrategia.status === 'sugerida' && (
                          <Button onClick={() => handleImplementarEstrategia(estrategia.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Implementar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fluxo-caixa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Fluxo de Caixa</CardTitle>
              <CardDescription>Projeções e variabilidade do faturamento</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={dadosFluxoCaixa}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                  <Area 
                    type="monotone" 
                    dataKey="receita_atual" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.6}
                    name="Receita Atual"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="receita_projetada" 
                    stackId="2"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.4}
                    name="Receita Projetada"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retencao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alunos em Risco de Cancelamento</CardTitle>
              <CardDescription>Identificação proativa de clientes com maior probabilidade de cancelamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alunosRisco.map((aluno) => (
                  <div key={aluno.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{aluno.nome}</h3>
                          <Badge variant={aluno.score_risco > 80 ? 'destructive' : aluno.score_risco > 60 ? 'default' : 'secondary'}>
                            Risco: {aluno.score_risco}%
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            R$ {aluno.valor_mensal}/mês • {aluno.tempo_como_aluno} meses
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm font-medium mb-1">Motivos identificados:</p>
                          <ul className="text-sm text-muted-foreground">
                            {aluno.motivos.map((motivo, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                {motivo}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-1">Ações recomendadas:</p>
                          <ul className="text-sm space-y-1">
                            {aluno.recomendacoes.map((recomendacao, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {recomendacao}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <Button onClick={() => handleContatarAluno(aluno.id)} variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Contatar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projecoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projeções de Cenários</CardTitle>
              <CardDescription>Análise de diferentes cenários de crescimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {projecoesCenarios?.map((cenario, index) => (
                  <div key={cenario.cenario} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold">{cenario.cenario}</h3>
                      <Badge variant={
                        cenario.cenario === 'Conservador' ? 'secondary' :
                        cenario.cenario === 'Moderado' ? 'default' : 'destructive'
                      }>
                        ROI: {cenario.roi_estimado}x
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>3 meses:</span>
                        <span className="font-medium">R$ {cenario.receita_projetada_3m.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>6 meses:</span>
                        <span className="font-medium">R$ {cenario.receita_projetada_6m.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>12 meses:</span>
                        <span className="font-medium">R$ {cenario.receita_projetada_12m.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span>Investimento:</span>
                        <span className="font-medium text-red-600">R$ {cenario.investimento_necessario.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}