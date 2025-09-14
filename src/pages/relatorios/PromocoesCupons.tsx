import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Percent, Plus, Sparkles, Target, TrendingUp, Users, Calendar, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface PromocaoInteligente {
  id: string;
  nome: string;
  tipo: 'percentual' | 'valor_fixo' | 'frete_gratis' | 'upgrade_gratuito';
  valor_desconto: number;
  codigo_cupom?: string;
  data_inicio: string;
  data_fim: string;
  limite_uso?: number;
  usado: number;
  condicoes: string[];
  segmento_alvo: string;
  status: 'ativa' | 'pausada' | 'finalizada' | 'agendada';
  roi_estimado: number;
  conversao_esperada: number;
  custo_estimado: number;
  receita_gerada: number;
  criada_por_ia: boolean;
  motivo_ia?: string;
}

interface AnalisePromocional {
  periodo: string;
  promocoes_ativas: number;
  conversao_media: number;
  roi_medio: number;
  receita_promocional: number;
}

export function PromocoesCupons() {
  const [promocoes, setPromocoes] = useState<PromocaoInteligente[]>([]);
  const [analises, setAnalises] = useState<AnalisePromocional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [iaAtivada, setIaAtivada] = useState(true);
  const [novaPromocao, setNovaPromocao] = useState<Partial<PromocaoInteligente>>({
    nome: '',
    tipo: 'percentual',
    valor_desconto: 0,
    data_inicio: '',
    data_fim: '',
    segmento_alvo: 'todos',
    status: 'agendada',
    criada_por_ia: false
  });
  const { toast } = useToast();

  // Dados simulados para demonstração
  const promocoesDemo: PromocaoInteligente[] = [
    {
      id: '1',
      nome: 'Volta às Aulas - IA Recomendada',
      tipo: 'percentual',
      valor_desconto: 30,
      codigo_cupom: 'VOLTA30',
      data_inicio: '2024-01-15',
      data_fim: '2024-02-15',
      limite_uso: 100,
      usado: 23,
      condicoes: ['Novos alunos', 'Matrícula de 6+ meses'],
      segmento_alvo: 'leads_qualificados',
      status: 'ativa',
      roi_estimado: 2.8,
      conversao_esperada: 15,
      custo_estimado: 2100,
      receita_gerada: 5880,
      criada_por_ia: true,
      motivo_ia: 'IA detectou queda de 12% nas matrículas em janeiro vs dezembro'
    },
    {
      id: '2',
      nome: 'Black Friday Premium',
      tipo: 'valor_fixo',
      valor_desconto: 50,
      codigo_cupom: 'BLACK50',
      data_inicio: '2023-11-24',
      data_fim: '2023-11-27',
      limite_uso: 200,
      usado: 187,
      condicoes: ['Upgrade para Premium', 'Pagamento anual'],
      segmento_alvo: 'alunos_basicos',
      status: 'finalizada',
      roi_estimado: 3.2,
      conversao_esperada: 25,
      custo_estimado: 9350,
      receita_gerada: 29920,
      criada_por_ia: false
    },
    {
      id: '3',
      nome: 'Retenção Inteligente - Personal',
      tipo: 'upgrade_gratuito',
      valor_desconto: 200,
      data_inicio: '2024-01-20',
      data_fim: '2024-01-31',
      limite_uso: 50,
      usado: 8,
      condicoes: ['Alunos com baixa frequência', '3+ meses sem Personal'],
      segmento_alvo: 'risco_cancelamento',
      status: 'ativa',
      roi_estimado: 4.1,
      conversao_esperada: 40,
      custo_estimado: 1600,
      receita_gerada: 6560,
      criada_por_ia: true,
      motivo_ia: 'Modelo preditivo identificou 15 alunos com alta probabilidade de cancelamento'
    }
  ];

  const analisesDemo: AnalisePromocional[] = [
    { periodo: 'Nov/23', promocoes_ativas: 3, conversao_media: 18.5, roi_medio: 2.9, receita_promocional: 12500 },
    { periodo: 'Dez/23', promocoes_ativas: 5, conversao_media: 22.1, roi_medio: 3.1, receita_promocional: 18750 },
    { periodo: 'Jan/24', promocoes_ativas: 2, conversao_media: 16.8, roi_medio: 3.5, receita_promocional: 8900 }
  ];

  useEffect(() => {
    // Simular carregamento dos dados
    setTimeout(() => {
      setPromocoes(promocoesDemo);
      setAnalises(analisesDemo);
      setLoading(false);
    }, 1000);
  }, []);

  const gerarPromocaoIA = () => {
    const promocoesIA = [
      {
        nome: 'Reativação Inteligente - 40% OFF',
        tipo: 'percentual' as const,
        valor_desconto: 40,
        segmento_alvo: 'inativos_90dias',
        roi_estimado: 3.6,
        motivo_ia: 'Detectados 45 ex-alunos com alta probabilidade de retorno'
      },
      {
        nome: 'Upsell Automatico - Premium',
        tipo: 'upgrade_gratuito' as const,
        valor_desconto: 150,
        segmento_alvo: 'alta_frequencia',
        roi_estimado: 4.2,
        motivo_ia: '25 alunos básicos com frequência acima de 5x/semana'
      },
      {
        nome: 'Indicação Premiada',
        tipo: 'valor_fixo' as const,
        valor_desconto: 75,
        segmento_alvo: 'alunos_satisfeitos',
        roi_estimado: 5.1,
        motivo_ia: 'Alunos com NPS >9 têm 67% de chance de indicar amigos'
      }
    ];

    const promocaoSelecionada = promocoesIA[Math.floor(Math.random() * promocoesIA.length)];
    
    const novaPromocaoIA: PromocaoInteligente = {
      ...promocaoSelecionada,
      id: Date.now().toString(),
      codigo_cupom: `IA${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      limite_uso: Math.floor(Math.random() * 50) + 20,
      usado: 0,
      condicoes: ['Gerada automaticamente pela IA', 'Baseada em análise preditiva'],
      status: 'agendada' as const,
      conversao_esperada: Math.floor(Math.random() * 20) + 10,
      custo_estimado: promocaoSelecionada.valor_desconto * 15,
      receita_gerada: 0,
      criada_por_ia: true
    };

    setPromocoes([novaPromocaoIA, ...promocoes]);
    toast({
      title: "Promoção IA Criada!",
      description: `"${promocaoSelecionada.nome}" foi gerada automaticamente com ROI estimado de ${promocaoSelecionada.roi_estimado}x`,
    });
  };

  const handleAddPromocao = () => {
    const promocao: PromocaoInteligente = {
      ...novaPromocao as PromocaoInteligente,
      id: Date.now().toString(),
      usado: 0,
      receita_gerada: 0,
      roi_estimado: 2.5,
      conversao_esperada: 12,
      custo_estimado: novaPromocao.valor_desconto! * 10
    };
    
    setPromocoes([promocao, ...promocoes]);
    setShowAddDialog(false);
    toast({
      title: "Promoção Criada",
      description: "Nova promoção foi adicionada com sucesso!",
    });
  };

  const totalReceita = promocoes.reduce((total, p) => total + p.receita_gerada, 0);
  const totalCusto = promocoes.reduce((total, p) => total + p.custo_estimado, 0);
  const roiMedio = totalCusto > 0 ? (totalReceita / totalCusto) : 0;
  const promocoesIA = promocoes.filter(p => p.criada_por_ia).length;

  const dadosROI = promocoes.slice(0, 5).map(p => ({
    nome: p.nome.substring(0, 15) + '...',
    roi: p.roi_estimado,
    receita: p.receita_gerada
  }));

  const dadosStatus = [
    { name: 'Ativas', value: promocoes.filter(p => p.status === 'ativa').length, color: '#10b981' },
    { name: 'Agendadas', value: promocoes.filter(p => p.status === 'agendada').length, color: '#f59e0b' },
    { name: 'Finalizadas', value: promocoes.filter(p => p.status === 'finalizada').length, color: '#6b7280' }
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promoções & Cupons</h1>
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
            <Percent className="h-8 w-8 text-orange-500" />
            Promoções & Cupons Inteligentes
          </h1>
          <p className="text-muted-foreground">
            IA ajusta valores automaticamente sem prejudicar margem de lucro
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center space-x-2">
            <Switch checked={iaAtivada} onCheckedChange={setIaAtivada} />
            <Label>IA Ativada</Label>
          </div>
          
          {iaAtivada && (
            <Button onClick={gerarPromocaoIA} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar com IA
            </Button>
          )}
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Promoção
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Promoção</DialogTitle>
                <DialogDescription>
                  Configure uma nova promoção ou cupom de desconto
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome da Promoção</Label>
                  <Input
                    id="nome"
                    value={novaPromocao.nome}
                    onChange={(e) => setNovaPromocao({...novaPromocao, nome: e.target.value})}
                    placeholder="Ex: Black Friday 2024"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo de Desconto</Label>
                  <Select value={novaPromocao.tipo} onValueChange={(value) => setNovaPromocao({...novaPromocao, tipo: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual (%)</SelectItem>
                      <SelectItem value="valor_fixo">Valor Fixo (R$)</SelectItem>
                      <SelectItem value="upgrade_gratuito">Upgrade Gratuito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="valor_desconto">
                    Valor do Desconto {novaPromocao.tipo === 'percentual' ? '(%)' : '(R$)'}
                  </Label>
                  <Input
                    id="valor_desconto"
                    type="number"
                    value={novaPromocao.valor_desconto}
                    onChange={(e) => setNovaPromocao({...novaPromocao, valor_desconto: parseFloat(e.target.value)})}
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="data_inicio">Data Início</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={novaPromocao.data_inicio}
                      onChange={(e) => setNovaPromocao({...novaPromocao, data_inicio: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="data_fim">Data Fim</Label>
                    <Input
                      id="data_fim"
                      type="date"
                      value={novaPromocao.data_fim}
                      onChange={(e) => setNovaPromocao({...novaPromocao, data_fim: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="segmento_alvo">Segmento Alvo</Label>
                  <Select value={novaPromocao.segmento_alvo} onValueChange={(value) => setNovaPromocao({...novaPromocao, segmento_alvo: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Clientes</SelectItem>
                      <SelectItem value="novos_alunos">Novos Alunos</SelectItem>
                      <SelectItem value="alunos_ativos">Alunos Ativos</SelectItem>
                      <SelectItem value="leads_qualificados">Leads Qualificados</SelectItem>
                      <SelectItem value="risco_cancelamento">Risco de Cancelamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="limite_uso">Limite de Uso (opcional)</Label>
                  <Input
                    id="limite_uso"
                    type="number"
                    value={novaPromocao.limite_uso || ''}
                    onChange={(e) => setNovaPromocao({...novaPromocao, limite_uso: parseInt(e.target.value)})}
                    placeholder="Ex: 100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddPromocao}>
                  Criar Promoção
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Promocional</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalReceita.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Custo: R$ {totalCusto.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roiMedio.toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground">
              Retorno sobre investimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promoções IA</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {promocoesIA}
            </div>
            <p className="text-xs text-muted-foreground">
              De {promocoes.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(promocoes.reduce((acc, p) => acc + p.conversao_esperada, 0) / promocoes.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Média esperada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance por ROI</CardTitle>
            <CardDescription>Retorno sobre investimento das promoções</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosROI}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'roi' ? `${value}x` : `R$ ${Number(value).toLocaleString('pt-BR')}`,
                  name === 'roi' ? 'ROI' : 'Receita'
                ]} />
                <Bar dataKey="roi" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das Promoções</CardTitle>
            <CardDescription>Distribuição por status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {dadosStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Promoções */}
      <Card>
        <CardHeader>
          <CardTitle>Promoções Ativas e Programadas</CardTitle>
          <CardDescription>Gestão completa de cupons e ofertas especiais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {promocoes.map((promocao) => (
              <div key={promocao.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{promocao.nome}</h3>
                      {promocao.criada_por_ia && (
                        <Badge variant="outline" className="text-purple-600 border-purple-200">
                          <Sparkles className="h-3 w-3 mr-1" />
                          IA
                        </Badge>
                      )}
                      <Badge variant={
                        promocao.status === 'ativa' ? 'default' :
                        promocao.status === 'agendada' ? 'secondary' :
                        promocao.status === 'finalizada' ? 'outline' : 'destructive'
                      }>
                        {promocao.status}
                      </Badge>
                      {promocao.codigo_cupom && (
                        <Badge variant="outline">
                          {promocao.codigo_cupom}
                        </Badge>
                      )}
                    </div>
                    
                    {promocao.motivo_ia && (
                      <p className="text-sm text-purple-600 mb-2 italic">
                        💡 {promocao.motivo_ia}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="font-medium">Desconto:</span>
                        <span className="ml-1">
                          {promocao.tipo === 'percentual' ? `${promocao.valor_desconto}%` : 
                           `R$ ${promocao.valor_desconto}`}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">ROI:</span>
                        <span className="text-green-600 ml-1">{promocao.roi_estimado}x</span>
                      </div>
                      <div>
                        <span className="font-medium">Uso:</span>
                        <span className="ml-1">
                          {promocao.usado}{promocao.limite_uso ? `/${promocao.limite_uso}` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Período:</span>
                        <span className="ml-1">
                          {new Date(promocao.data_inicio).toLocaleDateString('pt-BR')} - 
                          {new Date(promocao.data_fim).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {promocao.condicoes.map((condicao, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {condicao}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      R$ {promocao.receita_gerada.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Custo: R$ {promocao.custo_estimado.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}