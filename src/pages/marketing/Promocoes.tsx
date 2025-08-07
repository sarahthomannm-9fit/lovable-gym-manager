
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { Gift, Percent, Users, Calendar, TrendingUp } from "lucide-react";

export function Promocoes() {
  const promotions = [
    {
      id: 1,
      name: "Desconto Primeira Mensalidade",
      discount: "50%",
      type: "Captação",
      status: "ativa",
      validUntil: "2024-02-29",
      used: 23,
      limit: 50
    },
    {
      id: 2,
      name: "Amigo Indica Amigo",
      discount: "1 mês grátis",
      type: "Indicação",
      status: "ativa",
      validUntil: "2024-03-31",
      used: 8,
      limit: 100
    },
    {
      id: 3,
      name: "Black Friday Academia",
      discount: "70%",
      type: "Sazonal",
      status: "finalizada",
      validUntil: "2023-11-30",
      used: 45,
      limit: 50
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
      activeView="promocoes" 
      onViewChange={() => {}} 
      title="Promoções"
      subtitle="Gerencie ofertas e descontos especiais"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Promoções e Ofertas</h2>
            <p className="text-muted-foreground">Crie ofertas irresistíveis para atrair novos alunos</p>
          </div>
          <Button>
            <Gift className="mr-2 h-4 w-4" />
            Nova Promoção
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promoções Ativas</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Válidas até março</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilizações</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">31</div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18.5%</div>
              <p className="text-xs text-muted-foreground">+3.2% vs mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Economia Oferecida</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 2.1K</div>
              <p className="text-xs text-muted-foreground">Valor total em descontos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {promotions.map((promotion) => (
            <Card key={promotion.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {promotion.name}
                      <Badge className={getStatusColor(promotion.status)}>
                        {promotion.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {promotion.type} • Válida até {promotion.validUntil}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{promotion.discount}</p>
                    <p className="text-sm text-muted-foreground">de desconto</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Utilizações</p>
                      <p className="font-semibold">{promotion.used} / {promotion.limit}</p>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(promotion.used / promotion.limit) * 100}%` }}
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
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ideias de Promoções</CardTitle>
              <CardDescription>Sugestões baseadas em épocas sazonais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded">
                  <h4 className="font-medium">Volta às Aulas (Fevereiro)</h4>
                  <p className="text-sm text-muted-foreground">Desconto especial para estudantes</p>
                </div>
                <div className="p-3 border rounded">
                  <h4 className="font-medium">Dia das Mulheres (Março)</h4>
                  <p className="text-sm text-muted-foreground">Promoção focada no público feminino</p>
                </div>
                <div className="p-3 border rounded">
                  <h4 className="font-medium">Projeto Verão (Outubro)</h4>
                  <p className="text-sm text-muted-foreground">Pacote especial pré-verão</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance por Tipo</CardTitle>
              <CardDescription>Efetividade das diferentes categorias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Indicação</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-semibold">32.1%</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Captação</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-semibold">24.8%</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Retenção</span>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600 font-semibold">19.3%</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Sazonal</span>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600 font-semibold">15.7%</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
