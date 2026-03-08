import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, TrendingUp, Target, Phone, Mail, MessageSquare } from "lucide-react";
import { AddLeadDialog } from "@/components/marketing/AddLeadDialog";
import { useSupabaseLeads } from "@/hooks/marketing/useSupabaseLeads";
import { MarketingSuggestions } from "@/components/marketing/MarketingSuggestions";
import { CRMIntegration } from "@/components/marketing/CRMIntegration";

export function Captacao() {
  const { leads, leadsLoading } = useSupabaseLeads();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "novo": return "bg-blue-100 text-blue-800";
      case "qualificado": return "bg-green-100 text-green-800";
      case "contatado": return "bg-yellow-100 text-yellow-800";
      case "convertido": return "bg-purple-100 text-purple-800";
      case "perdido": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score?: number | null) => {
    if (score === null || score === undefined) return "text-muted-foreground";
    if (score >= 80) return "text-green-600 font-semibold";
    if (score >= 60) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const total = leads.length;
  const qualificados = leads.filter(l => l.status === "qualificado").length;
  const convertidos = leads.filter(l => l.status === "convertido").length;
  const conversao = total > 0 ? ((convertidos / total) * 100).toFixed(1) + "%" : "-";
  const novos7d = leads.filter(l => {
    const created = new Date(l.created_at);
    return Date.now() - created.getTime() <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const fontesMap = leads.reduce<Record<string, number>>((acc, l) => {
    const f = l.fonte || "Indefinida";
    acc[f] = (acc[f] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Captação de Leads</h2>
          <p className="text-muted-foreground">Acompanhe e qualifique seus leads</p>
        </div>
        <AddLeadDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Totais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsLoading ? "..." : total}</div>
            <p className="text-xs text-muted-foreground">Baseado nos seus registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Qualificados</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsLoading ? "..." : qualificados}</div>
            <p className="text-xs text-muted-foreground">{total > 0 ? `${((qualificados/total)*100).toFixed(1)}% do total` : "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsLoading ? "..." : conversao}</div>
            <p className="text-xs text-muted-foreground">Leads convertidos / total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos (7 dias)</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsLoading ? "..." : novos7d}</div>
            <p className="text-xs text-muted-foreground">Entradas recentes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList>
          <TabsTrigger value="leads">Lista de Leads</TabsTrigger>
          <TabsTrigger value="fontes">Fontes de Captação</TabsTrigger>
          <TabsTrigger value="funil">Funil de Conversão</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leads" className="space-y-4">
          <div className="grid gap-4">
            {leadsLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : leads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lead cadastrado.</p>
            ) : (
              leads.map((lead) => (
                <Card key={lead.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {lead.nome}
                          <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                        </CardTitle>
                        <CardDescription>
                          Fonte: {lead.fonte || "Indefinida"} • Criado em {new Date(lead.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${getScoreColor(lead.score || null)}`}>Score: {lead.score ?? "-"}</span>
                        <div className="flex gap-1">
                          <div className="inline-flex p-2 rounded border text-muted-foreground"><Phone className="h-4 w-4" /></div>
                          <div className="inline-flex p-2 rounded border text-muted-foreground"><Mail className="h-4 w-4" /></div>
                          <div className="inline-flex p-2 rounded border text-muted-foreground"><MessageSquare className="h-4 w-4" /></div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-muted-foreground">E-mail</p><p className="font-semibold">{lead.email || "-"}</p></div>
                      <div><p className="text-muted-foreground">Telefone</p><p className="font-semibold">{lead.telefone || "-"}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="fontes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Fontes de Captação</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leadsLoading ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : Object.keys(fontesMap).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados de fontes.</p>
                  ) : (
                    Object.entries(fontesMap).map(([fonte, count]) => (
                      <div key={fonte} className="flex justify-between items-center">
                        <span>{fonte}</span>
                        <Badge>{count} leads</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Performance por Fonte</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leadsLoading || total === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
                  ) : (
                    Object.entries(fontesMap).map(([fonte, count]) => (
                      <div key={fonte} className="flex justify-between items-center">
                        <span>{fonte}</span>
                        <span className="text-green-600 font-semibold">{((count / total) * 100).toFixed(1)}%</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
              <CardDescription>Acompanhe o progresso dos seus leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Leads Captados", sub: "Total de interessados", value: total, pct: "100%" },
                  { label: "Leads Qualificados", sub: "Com potencial de conversão", value: qualificados, pct: total > 0 ? `${((qualificados/total)*100).toFixed(1)}%` : "-" },
                  { label: "Agendamentos", sub: "Aulas experimentais", value: "-", pct: "Sem dados" },
                  { label: "Conversões", sub: "Matrículas efetivadas", value: convertidos, pct: total > 0 ? `${((convertidos/total)*100).toFixed(1)}%` : "-" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div><h4 className="font-semibold">{step.label}</h4><p className="text-muted-foreground">{step.sub}</p></div>
                    <div className="text-right"><p className="text-2xl font-bold">{step.value}</p><p className="text-sm text-muted-foreground">{step.pct}</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CRMIntegration />
      <MarketingSuggestions context="captacao" onCreateFromSuggestion={(s) => { console.log("[Suggestion] captacao", s); }} />
    </div>
  );
}
