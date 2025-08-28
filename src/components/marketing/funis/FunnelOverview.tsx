import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, Target, CheckCircle } from "lucide-react";

export function FunnelOverview() {
  const funnelStats = [
    {
      name: "Google Ads",
      leads: 245,
      conversions: 32,
      rate: 13.1,
      status: "ativo",
      color: "bg-blue-500"
    },
    {
      name: "Instagram",
      leads: 189,
      conversions: 28,
      rate: 14.8,
      status: "ativo", 
      color: "bg-pink-500"
    },
    {
      name: "WhatsApp",
      leads: 156,
      conversions: 41,
      rate: 26.3,
      status: "ativo",
      color: "bg-green-500"
    }
  ];

  const totalLeads = funnelStats.reduce((acc, f) => acc + f.leads, 0);
  const totalConversions = funnelStats.reduce((acc, f) => acc + f.conversions, 0);
  const avgConversionRate = (totalConversions / totalLeads * 100).toFixed(1);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLeads}</div>
          <p className="text-xs text-muted-foreground">
            +12% vs mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversões</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalConversions}</div>
          <p className="text-xs text-muted-foreground">
            +8% vs mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgConversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Meta: 15%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ROI Médio</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">4.2x</div>
          <p className="text-xs text-muted-foreground">
            R$ 4,20 para cada R$ 1,00
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Performance por Canal</CardTitle>
          <CardDescription>
            Comparação de desempenho dos funis de conversão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {funnelStats.map((funnel) => (
            <div key={funnel.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${funnel.color}`} />
                <span className="font-medium">{funnel.name}</span>
                <Badge variant="secondary">{funnel.status}</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
                  {funnel.leads} leads • {funnel.conversions} conversões
                </div>
                <div className="w-32">
                  <Progress value={funnel.rate} className="h-2" />
                </div>
                <div className="text-sm font-medium w-12">
                  {funnel.rate}%
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}