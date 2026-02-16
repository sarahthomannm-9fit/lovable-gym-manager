import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDataIntegration } from "@/components/DataIntegrationProvider";
import { Globe, Users, Target, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function NetworkDashboard() {
  const { leads, campanhas, experimentais, metrics, loading } = useDataIntegration();

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;

  const leadsPorFonte: Record<string, number> = {};
  leads.forEach((l: any) => { const f = l.fonte || 'outro'; leadsPorFonte[f] = (leadsPorFonte[f] || 0) + 1; });
  const fonteData = Object.entries(leadsPorFonte).map(([name, value]) => ({ name, value }));

  const campanhasAtivas = campanhas.filter((c: any) => c.status === 'ativa');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Network & Marketing</h1>
        <p className="text-muted-foreground">Leads, campanhas, funis e ROI por canal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" />Total Leads</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{metrics.leadsTotal}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Target className="h-4 w-4" />Convertidos</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{metrics.leadsConvertidos}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" />Taxa Conversão</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{metrics.taxaConversaoExperimental.toFixed(0)}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Globe className="h-4 w-4" />Campanhas Ativas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{campanhasAtivas.length}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Leads por Fonte</CardTitle></CardHeader>
          <CardContent>
            {fonteData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={fonteData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">Nenhum lead cadastrado</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Campanhas Ativas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {campanhasAtivas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma campanha ativa</p>
            ) : campanhasAtivas.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{c.titulo}</p>
                  <p className="text-xs text-muted-foreground">{c.canal} • {c.categoria}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{c.conversoes || 0} conversões</Badge>
                  {c.orcamento && <p className="text-xs text-muted-foreground mt-1">R$ {c.orcamento}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
