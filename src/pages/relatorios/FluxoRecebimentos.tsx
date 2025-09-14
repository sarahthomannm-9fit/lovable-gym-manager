import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpCircle, RefreshCw, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { useSupabaseFinancialReports } from "@/hooks/useSupabaseFinancialReports";

interface RecebimentoDetalhado {
  id: string;
  tipo: 'mensalidade' | 'pacote' | 'avulso' | 'extra';
  categoria: string;
  valor: number;
  data_recebimento: string;
  aluno_nome?: string;
  plano_nome?: string;
  metodo_pagamento: string;
  status: 'recebido' | 'pendente' | 'atrasado';
  descricao: string;
}

export function FluxoRecebimentos() {
  const [recebimentos, setRecebimentos] = useState<RecebimentoDetalhado[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const {
    faturamentoMensal,
    metricasGerais,
    evolucaoReceitas,
    loading: financialLoading,
    refetch: refetchFinancial
  } = useSupabaseFinancialReports();

  // Dados simulados para recebimentos detalhados
  const recebimentosDemo: RecebimentoDetalhado[] = [
    {
      id: '1',
      tipo: 'mensalidade',
      categoria: 'Plano Premium',
      valor: 150,
      data_recebimento: '2024-01-05',
      aluno_nome: 'João Silva',
      plano_nome: 'Premium Mensal',
      metodo_pagamento: 'cartao_credito',
      status: 'recebido',
      descricao: 'Mensalidade Janeiro 2024'
    },
    {
      id: '2',
      tipo: 'pacote',
      categoria: 'Personal Trainer',
      valor: 300,
      data_recebimento: '2024-01-10',
      aluno_nome: 'Maria Santos',
      metodo_pagamento: 'pix',
      status: 'recebido',
      descricao: 'Pacote 4 sessões Personal'
    },
    {
      id: '3',
      tipo: 'avulso',
      categoria: 'Day Use',
      valor: 25,
      data_recebimento: '2024-01-12',
      aluno_nome: 'Pedro Costa',
      metodo_pagamento: 'dinheiro',
      status: 'recebido',
      descricao: 'Uso avulso da academia'
    },
    {
      id: '4',
      tipo: 'extra',
      categoria: 'Suplementos',
      valor: 80,
      data_recebimento: '2024-01-15',
      aluno_nome: 'Ana Lima',
      metodo_pagamento: 'cartao_debito',
      status: 'recebido',
      descricao: 'Venda de whey protein'
    }
  ];

  useEffect(() => {
    // Simular carregamento dos dados
    setTimeout(() => {
      setRecebimentos(recebimentosDemo);
      setLoading(false);
    }, 1000);
  }, []);

  const totalRecebimentos = recebimentos.reduce((total, rec) => total + rec.valor, 0);
  const recebimentosPorTipo = recebimentos.reduce((acc, rec) => {
    acc[rec.tipo] = (acc[rec.tipo] || 0) + rec.valor;
    return acc;
  }, {} as Record<string, number>);

  const dadosGraficoTipo = Object.entries(recebimentosPorTipo).map(([tipo, valor]) => ({
    tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
    valor,
    quantidade: recebimentos.filter(r => r.tipo === tipo).length
  }));

  const dadosEvolucao = evolucaoReceitas?.map(item => ({
    mes: item.mes,
    receita: item.receita,
    ticket_medio: item.ticket_medio
  })) || [];

  const handleRefresh = () => {
    toast({
      title: "Atualizando",
      description: "Carregando dados mais recentes...",
    });
    refetchFinancial();
  };

  if (loading || financialLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fluxo de Recebimentos</h1>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ArrowUpCircle className="h-8 w-8 text-green-500" />
            Fluxo de Recebimentos
          </h1>
          <p className="text-muted-foreground">
            Análise de mensalidades, pacotes, avulsos e vendas extras
          </p>
        </div>
        
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {(metricasGerais?.total_receita_mes_atual || 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Receita do mês atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(metricasGerais?.ticket_medio || 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por cliente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(metricasGerais?.crescimento_percentual || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricasGerais?.total_alunos_ativos || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes ativos no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Análise */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recebimentos por Tipo</CardTitle>
            <CardDescription>Distribuição da receita por categoria de serviço</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGraficoTipo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'valor' ? `R$ ${Number(value).toLocaleString('pt-BR')}` : value,
                    name === 'valor' ? 'Receita' : 'Quantidade'
                  ]}
                />
                <Bar dataKey="valor" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolução da Receita</CardTitle>
            <CardDescription>Histórico mensal de recebimentos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosEvolucao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Receita']} />
                <Area 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Método de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pagamento</CardTitle>
          <CardDescription>Preferências dos clientes para pagamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {['PIX', 'Cartão de Crédito', 'Cartão de Débito'].map((metodo, index) => {
              const valor = [1500, 2300, 800][index];
              const quantidade = [12, 18, 8][index];
              return (
                <div key={metodo} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{metodo}</h3>
                    <Badge variant="secondary">{quantidade} transações</Badge>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {valor.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ticket médio: R$ {(valor / quantidade).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Últimos Recebimentos */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Recebimentos</CardTitle>
          <CardDescription>Histórico recente de recebimentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recebimentos.slice(0, 10).map((recebimento) => (
              <div key={recebimento.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{recebimento.categoria}</p>
                    <Badge variant={
                      recebimento.tipo === 'mensalidade' ? 'default' :
                      recebimento.tipo === 'pacote' ? 'secondary' :
                      recebimento.tipo === 'avulso' ? 'outline' : 'destructive'
                    }>
                      {recebimento.tipo}
                    </Badge>
                    <Badge variant="default">
                      {recebimento.metodo_pagamento}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{recebimento.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {recebimento.aluno_nome} • {new Date(recebimento.data_recebimento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    R$ {recebimento.valor.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}