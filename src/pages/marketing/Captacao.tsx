
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { UserPlus, Users, TrendingUp, Target, Phone, Mail, MessageSquare } from "lucide-react";

export function Captacao() {
  const leads = [
    {
      id: 1,
      name: "Maria Silva",
      email: "maria.silva@email.com",
      phone: "(11) 99999-9999",
      source: "Instagram",
      status: "qualificado",
      score: 85,
      createdAt: "2024-01-20"
    },
    {
      id: 2,
      name: "João Santos",
      email: "joao.santos@email.com",
      phone: "(11) 88888-8888",
      source: "Google Ads",
      status: "novo",
      score: 65,
      createdAt: "2024-01-19"
    },
    {
      id: 3,
      name: "Ana Costa",
      email: "ana.costa@email.com",
      phone: "(11) 77777-7777",
      source: "Indicação",
      status: "contatado",
      score: 92,
      createdAt: "2024-01-18"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "novo": return "bg-blue-100 text-blue-800";
      case "qualificado": return "bg-green-100 text-green-800";
      case "contatado": return "bg-yellow-100 text-yellow-800";
      case "convertido": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 font-semibold";
    if (score >= 60) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  return (
    <ResponsiveLayout 
      activeView="captacao" 
      onViewChange={() => {}} 
      title="Captação de Leads"
      subtitle="Gerencie seus leads e prospects"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Captação de Clientes</h2>
            <p className="text-muted-foreground">Acompanhe e qualifique seus leads</p>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Adicionar Lead
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Totais</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">143</div>
              <p className="text-xs text-muted-foreground">+12 esta semana</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Qualificados</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">67</div>
              <p className="text-xs text-muted-foreground">46.9% do total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23.1%</div>
              <p className="text-xs text-muted-foreground">+2.4% este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">+5 hoje</p>
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
              {leads.map((lead) => (
                <Card key={lead.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {lead.name}
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Fonte: {lead.source} • Criado em {lead.createdAt}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${getScoreColor(lead.score)}`}>
                          Score: {lead.score}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">E-mail</p>
                        <p className="font-semibold">{lead.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Telefone</p>
                        <p className="font-semibold">{lead.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fontes" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Fontes de Captação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Instagram</span>
                      <Badge>42 leads</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Google Ads</span>
                      <Badge>38 leads</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Indicação</span>
                      <Badge>31 leads</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Facebook</span>
                      <Badge>22 leads</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Site</span>
                      <Badge>10 leads</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance por Fonte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Indicação</span>
                      <span className="text-green-600 font-semibold">45.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Instagram</span>
                      <span className="text-green-600 font-semibold">28.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Google Ads</span>
                      <span className="text-yellow-600 font-semibold">21.1%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Facebook</span>
                      <span className="text-yellow-600 font-semibold">18.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Site</span>
                      <span className="text-red-600 font-semibold">12.0%</span>
                    </div>
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
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">Leads Captados</h4>
                      <p className="text-muted-foreground">Total de interessados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">143</p>
                      <p className="text-sm text-muted-foreground">100%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">Leads Qualificados</h4>
                      <p className="text-muted-foreground">Com potencial de conversão</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">67</p>
                      <p className="text-sm text-muted-foreground">46.9%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">Agendamentos</h4>
                      <p className="text-muted-foreground">Aulas experimentais marcadas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">45</p>
                      <p className="text-sm text-muted-foreground">31.5%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">Conversões</h4>
                      <p className="text-muted-foreground">Matriculas efetivadas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">33</p>
                      <p className="text-sm text-muted-foreground">23.1%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveLayout>
  );
}
