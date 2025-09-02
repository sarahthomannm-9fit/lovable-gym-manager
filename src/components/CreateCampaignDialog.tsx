import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, Target, DollarSign, Calendar, Users, 
  TrendingUp, CheckCircle, ArrowRight 
} from 'lucide-react';
import { useSupabaseProdutos, AnaliseProduto, Produto } from '@/hooks/useSupabaseProdutos';
import { useSupabaseCampaigns } from '@/hooks/marketing/useSupabaseCampaigns';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface CreateCampaignDialogProps {
  produto: Produto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCampaignDialog({ produto, open, onOpenChange }: CreateCampaignDialogProps) {
  const [analises, setAnalises] = useState<AnaliseProduto[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingCampaign, setCreatingCampaign] = useState<string | null>(null);
  const { getAnalisesProduto } = useSupabaseProdutos();
  const { addCampaign } = useSupabaseCampaigns();
  const { toast } = useToast();
  const navigate = useNavigate();

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
    
    setCreatingCampaign(campanhaSugerida.nome);
    try {
      await addCampaign({
        titulo: campanhaSugerida.nome,
        categoria: getCategoriaByTipo(campanhaSugerida.tipo),
        status: 'ativa',
        descricao: campanhaSugerida.objetivo,
        canal: campanhaSugerida.canal,
        orcamento: campanhaSugerida.orcamento_sugerido,
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date(Date.now() + (campanhaSugerida.duracao_dias * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        segmento: {
          produto_id: produto.id,
          produto_nome: produto.nome,
          target_publico: produto.target_publico
        }
      });

      toast({
        title: "Campanha Criada",
        description: `Campanha "${campanhaSugerida.nome}" foi criada com sucesso!`,
        action: (
          <Button size="sm" onClick={() => {
            navigate('/marketing/campanhas');
            onOpenChange(false);
          }}>
            Ver Campanhas
          </Button>
        )
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar campanha",
        variant: "destructive"
      });
    } finally {
      setCreatingCampaign(null);
    }
  };

  const getCategoriaByTipo = (tipo: string): string => {
    switch (tipo) {
      case 'install_campaign': return 'captacao';
      case 'awareness': return 'comunicacao';
      case 'conversion': return 'conversao';
      case 'search': return 'captacao';
      case 'local': return 'captacao';
      default: return 'conversao';
    }
  };

  const getTipoLabel = (tipo: string): string => {
    switch (tipo) {
      case 'install_campaign': return 'Campanha de Instalação';
      case 'awareness': return 'Conscientização';
      case 'conversion': return 'Conversão';
      case 'search': return 'Busca';
      case 'local': return 'Local';
      default: return 'Conversão';
    }
  };

  if (!produto) return null;

  const analise = analises[0]; // Análise mais recente

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Target className="h-5 w-5" />
            Criar Campanhas para: {produto.nome}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        ) : analise ? (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Orçamento Total</p>
                      <p className="text-lg font-bold">
                        R$ {produto.orcamento_marketing?.toLocaleString('pt-BR') || '0'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Alcance Estimado</p>
                      <p className="text-lg font-bold">
                        {analise.metricas_projetadas?.alcance_estimado?.toLocaleString('pt-BR') || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">ROI Projetado</p>
                      <p className="text-lg font-bold text-green-600">
                        {analise.metricas_projetadas?.roi_projetado || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campanhas Sugeridas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Campanhas Recomendadas pela IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analise.campanhas_sugeridas?.map((campanha: any, index: number) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{campanha.nome}</h4>
                              <Badge variant="secondary">{getTipoLabel(campanha.tipo)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{campanha.objetivo}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Canal</p>
                                <Badge variant="outline" className="mt-1">
                                  {campanha.canal}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Orçamento</p>
                                <p className="font-semibold mt-1">
                                  R$ {campanha.orcamento_sugerido?.toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Duração</p>
                                <p className="font-semibold mt-1 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {campanha.duracao_dias} dias
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Categoria</p>
                                <Badge className="mt-1" variant="default">
                                  {getCategoriaByTipo(campanha.tipo)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={() => criarCampanha(campanha)}
                            disabled={creatingCampaign === campanha.nome}
                            className="flex-1"
                          >
                            {creatingCampaign === campanha.nome ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Criando...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-2" />
                                Criar Esta Campanha
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )) || <p className="text-muted-foreground">Nenhuma campanha sugerida disponível</p>}
                </div>

                {analise.campanhas_sugeridas?.length > 0 && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="font-medium">Próximos Passos</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Após criar as campanhas, você pode monitorá-las e otimizá-las na seção de Marketing.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        navigate('/marketing/campanhas');
                        onOpenChange(false);
                      }}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Ver Todas as Campanhas
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Análise Necessária</h3>
              <p className="text-muted-foreground text-center mb-4">
                Para criar campanhas automáticas, primeiro é preciso gerar a análise do produto.
              </p>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}