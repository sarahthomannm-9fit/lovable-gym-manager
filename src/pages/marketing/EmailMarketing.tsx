
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { Mail, Users, TrendingUp, Eye, MousePointer } from "lucide-react";
import { AddCampaignDialog } from "@/components/marketing/AddCampaignDialog";
import { useSupabaseMarketingMessages } from "@/hooks/marketing/useSupabaseMarketingMessages";
import { MarketingSuggestions } from "@/components/marketing/MarketingSuggestions";

export function EmailMarketing() {
  const { messages, messagesLoading } = useSupabaseMarketingMessages("email");

  const totalDest = messages.reduce((acc, m) => acc + (m.destinatarios || 0), 0);
  const totalEntregues = messages.reduce((acc, m) => acc + (m.entregues || 0), 0);
  const totalLidas = messages.reduce((acc, m) => acc + (m.lidas || 0), 0);

  const taxaAbertura = totalDest > 0 ? ((totalLidas / totalDest) * 100).toFixed(1) + "%" : "-";
  const taxaCliques = "-"; // não há campo de cliques neste momento
  const assinantesAtivos = "-"; // sem tabela de assinantes dedicada
  const roi = "-"; // sem origem de dados

  return (
    <ResponsiveLayout 
      activeView="email-marketing" 
      onViewChange={() => {}} 
      title="E-mail Marketing"
      subtitle="Campanhas de e-mail para engajamento e conversão"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">E-mail Marketing</h2>
            <p className="text-muted-foreground">Estatísticas baseadas nas mensagens registradas</p>
          </div>
          <AddCampaignDialog triggerLabel="Nova Campanha" initialCategoria="email" initialTitulo="Campanha de E-mail" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messagesLoading ? "..." : taxaAbertura}</div>
              <p className="text-xs text-muted-foreground">Lidas / Destinatários</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Cliques</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messagesLoading ? "..." : taxaCliques}</div>
              <p className="text-xs text-muted-foreground">Sem dados de clique</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assinantesAtivos}</div>
              <p className="text-xs text-muted-foreground">Sem base de assinantes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roi}</div>
              <p className="text-xs text-muted-foreground">Sem origem de dados</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Campanhas Recentes</CardTitle>
              <CardDescription>Últimos registros de envio (canal: email)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messagesLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma mensagem registrada.</p>
                ) : (
                  messages.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{m.titulo || "(sem título)"}</h4>
                        <p className="text-muted-foreground">Enviado para {m.destinatarios || 0} destinatários</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600">
                          {m.destinatarios ? `${(((m.lidas || 0) / m.destinatarios) * 100).toFixed(1)}% aberto` : "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.entregues ? `${(((m.entregues || 0) / (m.enviadas || m.destinatarios || 1)) * 100).toFixed(1)}% entregue` : "-"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segmentos de Audiência</CardTitle>
              <CardDescription>Organize seus contatos por grupos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Nenhum segmento cadastrado.</p>
                <Button variant="outline">Criar Segmento</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <MarketingSuggestions
          context="email"
          onCreateFromSuggestion={(s) => {
            console.log("[Suggestion] email", s);
          }}
        />
      </div>
    </ResponsiveLayout>
  );
}
