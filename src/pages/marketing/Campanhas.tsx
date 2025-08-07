
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { Plus, Target, Users, TrendingUp, Eye } from "lucide-react";

export function Campanhas() {
  const campaigns = [
    {
      id: 1,
      name: "Volta às Aulas 2024",
      status: "ativa",
      type: "Captação",
      reach: 1250,
      conversions: 45,
      budget: 800,
      startDate: "2024-01-15",
      endDate: "2024-02-29"
    },
    {
      id: 2,
      name: "Promoção Amigo Indica Amigo",
      status: "pausada",
      type: "Conversão",
      reach: 890,
      conversions: 23,
      budget: 500,
      startDate: "2024-01-01",
      endDate: "2024-03-31"
    },
    {
      id: 3,
      name: "Black Friday Fitness",
      status: "finalizada",
      type: "Vendas",
      reach: 2100,
      conversions: 78,
      budget: 1200,
      startDate: "2023-11-20",
      endDate: "2023-11-30"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativa": return "bg-green-100 text-green-800";
      case "pausada": return "bg-yellow-100 text-yellow-800";
      case "finalizada": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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
            <h2 className="text-2xl font-bold">Campanhas Ativas</h2>
            <p className="text-muted-foreground">Acompanhe o desempenho das suas campanhas</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Campanha
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">+1 desde o mês passado</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alcance Total</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.240</div>
              <p className="text-xs text-muted-foreground">+15% desde o mês passado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">146</div>
              <p className="text-xs text-muted-foreground">+8% desde o mês passado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.4%</div>
              <p className="text-xs text-muted-foreground">+0.5% desde o mês passado</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {campaign.name}
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {campaign.type} • {campaign.startDate} até {campaign.endDate}
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
                    <p className="font-semibold">{campaign.reach.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversões</p>
                    <p className="font-semibold">{campaign.conversions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Orçamento</p>
                    <p className="font-semibold">R$ {campaign.budget}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ResponsiveLayout>
  );
}
