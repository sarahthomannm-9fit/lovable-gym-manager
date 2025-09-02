import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, Target, BarChart3, Users, DollarSign, 
  Zap, CheckCircle, AlertCircle, ArrowRight 
} from 'lucide-react';
import { useSupabaseProdutos, AnaliseProduto, Produto } from '@/hooks/useSupabaseProdutos';
import { useSupabaseCampaigns } from '@/hooks/marketing/useSupabaseCampaigns';
import { useToast } from '@/hooks/use-toast';

interface ProductAnalysisDialogProps {
  produto: Produto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductAnalysisDialog({ produto, open, onOpenChange }: ProductAnalysisDialogProps) {
  const [analises, setAnalises] = useState<AnaliseProduto[]>([]);
  const [loading, setLoading] = useState(false);
  const { getAnalisesProduto } = useSupabaseProdutos();
  const { addCampaign } = useSupabaseCampaigns();
  const { toast } = useToast();

  useEffect(() => {
    if (produto && open) {
      loadAnalises();
    }
  }, [produto, open]);

  const loadAnalises = async () => {
    if (!produto) return;
    setLoading(true);
    try {
      const data = await getAnalisesProduto(produto.id);
      setAnalises(data);
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
    } finally {
      setLoading(false);
    }
  };

  const criarCampanha = async (campanhaSugerida: any) => {
    if (!produto) return;
    
    try {
      await addCampaign({
        titulo: campanhaSugerida.nome,
        categoria: 'conversao',
        status: 'ativa',
        descricao: campanhaSugerida.objetivo,
        canal: campanhaSugerida.canal,
        orcamento: campanhaSugerida.orcamento_sugerido,
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date(Date.now() + (campanhaSugerida.duracao_dias * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      });

      toast({
        title: "Campanha Criada",
        description: `Campanha "${campanhaSugerida.nome}" foi criada com sucesso!`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar campanha",
        variant: "destructive"
      });
    }
  };

  if (!produto) return null;

  const analise = analises[0]; // Análise mais recente

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5" />
            Análise de Produto: {produto.nome}
          </DialogTitle>
        </DialogHeader>

        {analise ? (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="market">Mercado</TabsTrigger>
              <TabsTrigger value="strategies">Estratégias</TabsTrigger>
              <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Score de Viabilidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Progress value={analise.score_viabilidade} className="flex-1" />
                      <span className="text-2xl font-bold">{analise.score_viabilidade}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Alcance Estimado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">
                        {analise.metricas_projetadas?.alcance_estimado?.toLocaleString('pt-BR') || 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">ROI Projetado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        {analise.metricas_projetadas?.roi_projetado || 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="market" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Mercado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nicho</p>
                      <p className="capitalize">{analise.analise_mercado?.nicho || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Concorrência</p>
                      <Badge variant={analise.analise_mercado?.concorrencia === 'alta' ? 'destructive' : 'secondary'}>
                        {analise.analise_mercado?.concorrencia || 'N/A'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Potencial de Mercado</p>
                      <Badge variant={analise.analise_mercado?.potencial_mercado === 'alto' ? 'default' : 'secondary'}>
                        {analise.analise_mercado?.potencial_mercado || 'N/A'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sazonalidade</p>
                      <p>{analise.analise_mercado?.sazonalidade || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="strategies" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estratégias Recomendadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analise.estrategias_recomendadas?.map((estrategia: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className={`p-1 rounded-full ${
                          estrategia.prioridade === 'alta' ? 'bg-red-100 text-red-600' :
                          estrategia.prioridade === 'média' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {estrategia.prioridade === 'alta' ? <AlertCircle className="h-3 w-3" /> : 
                           <CheckCircle className="h-3 w-3" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{estrategia.estrategia}</h4>
                          <p className="text-sm text-muted-foreground">{estrategia.descricao}</p>
                          <Badge className="mt-1" variant={
                            estrategia.prioridade === 'alta' ? 'destructive' :
                            estrategia.prioridade === 'média' ? 'secondary' : 'outline'
                          }>
                            {estrategia.prioridade} prioridade
                          </Badge>
                        </div>
                      </div>
                    )) || <p className="text-muted-foreground">Nenhuma estratégia disponível</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Campanhas Sugeridas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analise.campanhas_sugeridas?.map((campanha: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{campanha.nome}</h4>
                            <p className="text-sm text-muted-foreground">{campanha.objetivo}</p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => criarCampanha(campanha)}
                            className="ml-2"
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Criar Campanha
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Canal</p>
                            <Badge variant="outline">{campanha.canal}</Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Orçamento</p>
                            <p className="font-medium">
                              R$ {campanha.orcamento_sugerido?.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Duração</p>
                            <p className="font-medium">{campanha.duracao_dias} dias</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Tipo</p>
                            <Badge>{campanha.tipo}</Badge>
                          </div>
                        </div>
                      </div>
                    )) || <p className="text-muted-foreground">Nenhuma campanha sugerida</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma análise disponível</h3>
              <p className="text-muted-foreground text-center mb-4">
                Este produto ainda não possui análise gerada. A análise é criada automaticamente ao cadastrar o produto.
              </p>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}