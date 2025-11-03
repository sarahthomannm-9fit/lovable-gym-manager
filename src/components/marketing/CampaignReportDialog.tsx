import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, Target, Calendar, BarChart } from "lucide-react";
import { Campaign } from "@/hooks/marketing/useSupabaseCampaigns";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CampaignReportDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignReportDialog({ campaign, open, onOpenChange }: CampaignReportDialogProps) {
  if (!campaign) return null;

  // Calcular métricas
  const taxaConversao = campaign.alcance 
    ? ((campaign.conversoes || 0) / campaign.alcance * 100).toFixed(2)
    : '0.00';
  
  const custoConversao = campaign.conversoes && campaign.orcamento
    ? (campaign.orcamento / campaign.conversoes).toFixed(2)
    : '0.00';

  const roi = campaign.orcamento && campaign.conversoes
    ? (((campaign.conversoes * 150) - campaign.orcamento) / campaign.orcamento * 100).toFixed(0)
    : '0';

  // Dados para o gráfico (simulado)
  const performanceData = [
    { semana: 'Sem 1', alcance: Math.floor((campaign.alcance || 0) * 0.2), conversoes: Math.floor((campaign.conversoes || 0) * 0.15) },
    { semana: 'Sem 2', alcance: Math.floor((campaign.alcance || 0) * 0.3), conversoes: Math.floor((campaign.conversoes || 0) * 0.25) },
    { semana: 'Sem 3', alcance: Math.floor((campaign.alcance || 0) * 0.3), conversoes: Math.floor((campaign.conversoes || 0) * 0.35) },
    { semana: 'Sem 4', alcance: Math.floor((campaign.alcance || 0) * 0.2), conversoes: Math.floor((campaign.conversoes || 0) * 0.25) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Relatório da Campanha: {campaign.titulo}
          </DialogTitle>
          <DialogDescription>
            {campaign.categoria} • {campaign.data_inicio || '-'} até {campaign.data_fim || '-'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status da Campanha */}
          <div className="flex items-center gap-2">
            <Badge variant={campaign.status === 'finalizada' ? 'secondary' : campaign.status === 'ativa' ? 'default' : 'outline'}>
              {campaign.status}
            </Badge>
            <span className="text-sm text-muted-foreground">{campaign.canal || 'Múltiplos canais'}</span>
          </div>

          {/* Métricas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Alcance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(campaign.alcance || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">pessoas impactadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Conversões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign.conversoes || 0}</div>
                <p className="text-xs text-muted-foreground">leads gerados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  Taxa Conversão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{taxaConversao}%</div>
                <p className="text-xs text-muted-foreground">do alcance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-orange-500" />
                  ROI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roi}%</div>
                <p className="text-xs text-muted-foreground">retorno investimento</p>
              </CardContent>
            </Card>
          </div>

          {/* Análise Financeira */}
          <Card>
            <CardHeader>
              <CardTitle>Análise Financeira</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Orçamento Total</p>
                  <p className="text-lg font-semibold">R$ {(campaign.orcamento || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Custo por Conversão</p>
                  <p className="text-lg font-semibold">R$ {custoConversao}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Receita Estimada</p>
                  <p className="text-lg font-semibold text-green-600">
                    R$ {((campaign.conversoes || 0) * 150).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Semanal</CardTitle>
              <CardDescription>Evolução do alcance e conversões ao longo da campanha</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semana" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="alcance" fill="hsl(var(--primary))" name="Alcance" />
                  <Bar dataKey="conversoes" fill="#10b981" name="Conversões" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Insights e Recomendações */}
          <Card>
            <CardHeader>
              <CardTitle>Insights da IA</CardTitle>
              <CardDescription>Análise automática da campanha</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm font-medium">✓ Performance</p>
                <p className="text-sm text-muted-foreground">
                  {Number(taxaConversao) > 5 
                    ? "Excelente taxa de conversão! Campanha muito efetiva."
                    : "Taxa de conversão abaixo da média. Considere ajustar segmentação."}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm font-medium">✓ ROI</p>
                <p className="text-sm text-muted-foreground">
                  {Number(roi) > 50
                    ? "ROI positivo. Ótimo retorno sobre investimento."
                    : "ROI baixo. Otimize custos ou melhore segmentação."}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-sm font-medium">✓ Recomendação</p>
                <p className="text-sm text-muted-foreground">
                  Replique esta estratégia para campanhas futuras com ajustes de orçamento baseados no ROI observado.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
