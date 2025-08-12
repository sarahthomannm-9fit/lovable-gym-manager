
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { Plus, Target, Users, TrendingUp, Eye } from "lucide-react";
import { useSupabaseCampaigns } from "@/hooks/marketing/useSupabaseCampaigns";
import { AddCampaignDialog } from "@/components/marketing/AddCampaignDialog";
import { MarketingSuggestions } from "@/components/marketing/MarketingSuggestions";

export function Campanhas() {
  const { campaigns, campaignsLoading } = useSupabaseCampaigns();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativa": return "bg-green-100 text-green-800";
      case "pausada": return "bg-yellow-100 text-yellow-800";
      case "finalizada": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const ativas = campaigns.filter(c => c.status === "ativa");
  const alcanceTotal = campaigns.reduce((acc, c) => acc + (c.alcance || 0), 0);
  const conversoesTotal = campaigns.reduce((acc, c) => acc + (c.conversoes || 0), 0);
  const taxaConversao = alcanceTotal > 0 ? ((conversoesTotal / alcanceTotal) * 100).toFixed(1) + "%" : "-";

  return (
    <ResponsiveLayout 
      activeView="campanhas" 
      onViewChange={() => {}} 
      title="Campanhas de Marketing"
      subtitle="Gerencie suas campanhas de captação e conversão"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Campanhas</h2>
            <p className="text-muted-foreground">Baseadas nos seus registros</p>
          </div>
          <AddCampaignDialog triggerLabel="Nova Campanha" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignsLoading ? "..." : ativas.length}</div>
              <p className="text-xs text-muted-foreground">Total no momento</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alcance Total</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignsLoading ? "..." : alcanceTotal.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Soma do campo alcance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignsLoading ? "..." : conversoesTotal}</div>
              <p className="text-xs text-muted-foreground">Soma do campo conversões</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignsLoading ? "..." : taxaConversao}</div>
              <p className="text-xs text-muted-foreground">Conversões / alcance</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {campaignsLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma campanha cadastrada.</p>
          ) : (
            campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {campaign.titulo}
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {campaign.categoria} • {campaign.data_inicio || "-"} até {campaign.data_fim || "-"}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Alcance</p>
                      <p className="font-semibold">{(campaign.alcance || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Conversões</p>
                      <p className="font-semibold">{campaign.conversoes || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Orçamento</p>
                      <p className="font-semibold">{campaign.orcamento ? `R$ ${campaign.orcamento}` : "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <MarketingSuggestions
          context="campanhas"
          onCreateFromSuggestion={(s) => {
            console.log("[Suggestion] campanhas", s);
          }}
        />
      </div>
    </ResponsiveLayout>
  );
}
