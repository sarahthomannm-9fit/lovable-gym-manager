import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Clock, Calendar } from "lucide-react";
import { useSupabaseLeads } from "@/hooks/marketing/useSupabaseLeads";
import { AddCampaignDialog } from "@/components/marketing/AddCampaignDialog";
import { MarketingSuggestions } from "@/components/marketing/MarketingSuggestions";

export function Conversao() {
  const { leads, leadsLoading } = useSupabaseLeads();
  const total = leads.length;
  const qualificados = leads.filter(l => l.status === "qualificado").length;
  const convertidos = leads.filter(l => l.status === "convertido").length;
  const taxaConversao = total > 0 ? ((convertidos / total) * 100).toFixed(1) + "%" : "-";

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Otimização de Conversão</h2>
          <p className="text-muted-foreground">Baseado nos seus dados de leads</p>
        </div>
        <AddCampaignDialog triggerLabel="Nova Estratégia" initialCategoria="conversao" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{leadsLoading ? "..." : taxaConversao}</div><p className="text-xs text-muted-foreground">Convertidos / Total</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Leads Qualificados</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{leadsLoading ? "..." : qualificados}</div><p className="text-xs text-muted-foreground">Prontos para conversão</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Aulas Experimentais</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">-</div><p className="text-xs text-muted-foreground">Sem dados</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tempo Médio</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">-</div><p className="text-xs text-muted-foreground">Lead → Cliente</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Estratégias de Conversão</CardTitle><CardDescription>Registre suas táticas e acompanhe</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg"><p className="text-muted-foreground text-sm">Cadastre estratégias como campanhas de follow-up, ofertas para primeira mensalidade, etc.</p></div>
              <AddCampaignDialog triggerLabel="Cadastrar Estratégia" initialCategoria="conversao" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Oportunidades</CardTitle><CardDescription>Áreas para otimizar suas conversões</CardDescription></CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg"><p className="text-muted-foreground text-sm">Exiba aqui indicadores a partir de dados reais que você cadastrar.</p></div>
          </CardContent>
        </Card>
      </div>

      <MarketingSuggestions context="conversao" onCreateFromSuggestion={(s) => { console.log("[Suggestion] conversao", s); }} />
    </div>
  );
}
