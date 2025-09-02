import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddProductDialog } from '@/components/AddProductDialog';
import { ProductAnalysisDialog } from '@/components/ProductAnalysisDialog';
import { CreateCampaignDialog } from '@/components/CreateCampaignDialog';
import { 
  Smartphone, Monitor, Users, Package, TrendingUp, 
  Target, BarChart3, Lightbulb, AlertCircle, CheckCircle 
} from 'lucide-react';
import { useSupabaseProdutos, Produto } from '@/hooks/useSupabaseProdutos';

export function Produtos() {
  const { produtos, loading } = useSupabaseProdutos();
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showCampaign, setShowCampaign] = useState(false);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'aplicativo_mobile': return Smartphone;
      case 'software': return Monitor;
      case 'servicos': return Users;
      default: return Package;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'aplicativo_mobile': return 'App Mobile';
      case 'software': return 'Software';
      case 'servicos': return 'Serviços';
      default: return 'Produtos';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Ativo</Badge>;
      case 'analise':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Análise</Badge>;
      default:
        return <Badge variant="outline">Inativo</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produtos & Campanhas</h1>
          <p className="text-muted-foreground">
            Gerencie produtos e campanhas automatizadas com IA
          </p>
        </div>
        <AddProductDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {produtos.filter(p => p.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {produtos.filter(p => p.status === 'analise').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {produtos.reduce((sum, p) => sum + (p.orcamento_marketing || 0), 0).toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produtos List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {produtos.map((produto) => {
          const TipoIcon = getTipoIcon(produto.tipo);
          
          return (
            <Card key={produto.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TipoIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{produto.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getTipoLabel(produto.tipo)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(produto.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {produto.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {produto.descricao}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {produto.preco && (
                    <div>
                      <p className="text-muted-foreground">Preço</p>
                      <p className="font-semibold">
                        R$ {produto.preco.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                  {produto.orcamento_marketing && (
                    <div>
                      <p className="text-muted-foreground">Orçamento</p>
                      <p className="font-semibold">
                        R$ {produto.orcamento_marketing.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>

                {produto.target_publico && (
                  <div>
                    <p className="text-muted-foreground text-sm">Público-Alvo</p>
                    <p className="text-sm">{produto.target_publico}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedProduct(produto);
                      setShowAnalysis(true);
                    }}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Análises
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedProduct(produto);
                      setShowCampaign(true);
                    }}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Campanhas
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {produtos.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro produto para gerar campanhas automatizadas
            </p>
            <AddProductDialog />
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ProductAnalysisDialog 
        produto={selectedProduct}
        open={showAnalysis}
        onOpenChange={setShowAnalysis}
      />
      
      <CreateCampaignDialog 
        produto={selectedProduct}
        open={showCampaign}
        onOpenChange={setShowCampaign}
      />
    </div>
  );
}