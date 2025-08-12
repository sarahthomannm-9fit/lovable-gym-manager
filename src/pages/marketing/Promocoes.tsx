
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { Gift, Percent, Users, Calendar, TrendingUp } from "lucide-react";
import { useSupabasePromotions } from "@/hooks/marketing/useSupabasePromotions";
import { AddPromotionDialog } from "@/components/marketing/AddPromotionDialog";
import { MarketingSuggestions } from "@/components/marketing/MarketingSuggestions";

export function Promocoes() {
  const { promotions, promotionsLoading } = useSupabasePromotions();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativa": return "bg-green-100 text-green-800";
      case "pausada": return "bg-yellow-100 text-yellow-800";
      case "finalizada": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const ativas = promotions.filter(p => p.status === "ativa").length;
  const totalUsos = promotions.reduce((acc, p) => acc + (p.usado || 0), 0);
  const totalLimite = promotions.reduce((acc, p) => acc + (p.limite || 0), 0);
  const taxaConversao = "-"; // sem base para taxa real
  const economiaOferecida = "-"; // sem origem de valores

  return (
    <ResponsiveLayout 
      activeView="promocoes" 
      onViewChange={() => {}} 
      title="Promoções"
      subtitle="Gerencie ofertas e descontos especiais"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Promoções e Ofertas</h2>
            <p className="text-muted-foreground">Cadastre promoções reais e acompanhe</p>
          </div>
          <AddPromotionDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promoções Ativas</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{promotionsLoading ? "..." : ativas}</div>
              <p className="text-xs text-muted-foreground">Válidas no momento</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilizações</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{promotionsLoading ? "..." : totalUsos}</div>
              <p className="text-xs text-muted-foreground">Total usado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taxaConversao}</div>
              <p className="text-xs text-muted-foreground">Sem base de cálculo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Limite Total</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{promotionsLoading ? "..." : totalLimite}</div>
              <p className="text-xs text-muted-foreground">Soma do limite</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {promotionsLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : promotions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma promoção cadastrada.</p>
          ) : (
            promotions.map((promotion) => (
              <Card key={promotion.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {promotion.nome}
                        <Badge className={getStatusColor(promotion.status)}>
                          {promotion.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {promotion.tipo || "Geral"} • Válida até {promotion.valido_ate || "-"}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{promotion.desconto}</p>
                      <p className="text-sm text-muted-foreground">de desconto</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Utilizações</p>
                        <p className="font-semibold">{promotion.usado || 0} / {promotion.limite || "-"}</p>
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: promotion.limite ? `${Math.min(100, ((promotion.usado || 0) / promotion.limite) * 100)}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        Ver Relatório
                      </Button>
                      <Button size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ideias de Promoções</CardTitle>
              <CardDescription>Sugestões para iniciar</CardDescription>
            </CardHeader>
            <CardContent>
              <MarketingSuggestions
                context="promocoes"
                onCreateFromSuggestion={(s) => {
                  console.log("[Suggestion] promocoes", s);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance por Tipo</CardTitle>
              <CardDescription>Baseada nos seus registros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {promotions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados.</p>
                ) : (
                  Array.from(new Set(promotions.map(p => p.tipo || "Geral"))).map((tipo) => {
                    const group = promotions.filter(p => (p.tipo || "Geral") === tipo);
                    const usos = group.reduce((acc, p) => acc + (p.usado || 0), 0);
                    return (
                      <div key={tipo} className="flex justify-between items-center">
                        <span>{tipo}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-semibold">{usos}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: group.length > 0 ? `${Math.min(100, (usos / (group.length * 100)) * 100)}%` : "0%" }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
