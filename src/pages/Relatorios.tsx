import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart3, TrendingUp, CreditCard, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReceitaRelatório {
  nome_plano: string;
  forma_pagamento: string;
  total_recebido: number;
}

export function Relatorios() {
  const [receitas, setReceitas] = useState<ReceitaRelatório[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReceitas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('relatorio_receitas_por_plano');
      
      if (error) throw error;
      setReceitas(data || []);
    } catch (error) {
      console.error('Erro ao buscar relatório de receitas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o relatório financeiro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceitas();
  }, []);

  const totalGeral = receitas.reduce((total, receita) => total + receita.total_recebido, 0);
  const totalPorPlano = receitas.reduce((acc, receita) => {
    acc[receita.nome_plano] = (acc[receita.nome_plano] || 0) + receita.total_recebido;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatório Financeiro</h1>
        <p className="text-muted-foreground">
          Análise detalhada das receitas por plano e forma de pagamento.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalGeral.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total arrecadado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(totalPorPlano).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tipos de planos com receita
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
              R$ {receitas.length > 0 ? (totalGeral / receitas.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por transação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formas de Pagamento</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(receitas.map(r => r.forma_pagamento)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Métodos diferentes utilizados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receitas por Plano</CardTitle>
            <CardDescription>Distribuição de receitas por tipo de plano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(totalPorPlano).map(([plano, valor]) => (
                <div key={plano} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{plano}</span>
                  <Badge variant="secondary">R$ {valor.toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Forma de Pagamento</CardTitle>
            <CardDescription>Receitas detalhadas por método de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {receitas.map((receita, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {receita.nome_plano}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        via {receita.forma_pagamento}
                      </p>
                    </div>
                    <Badge variant="outline">
                      R$ {receita.total_recebido.toFixed(2)}
                    </Badge>
                  </div>
                  {index < receitas.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {receitas.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma receita encontrada</CardTitle>
            <CardDescription>
              Não há dados de receitas para exibir no momento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              As receitas aparecerão aqui quando houver vínculos entre alunos e planos com formas de pagamento definidas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}