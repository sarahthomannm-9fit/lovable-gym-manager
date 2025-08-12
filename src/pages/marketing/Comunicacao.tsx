
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { MessageSquare, Send, Users, Clock, CheckCircle, Instagram, Facebook, MessageCircle } from "lucide-react";

export function Comunicacao() {
  const messages = [
    {
      id: 1,
      title: "Lembrete de Aula - Pilates",
      channel: "WhatsApp",
      recipients: 25,
      sent: 25,
      delivered: 24,
      read: 18,
      status: "entregue",
      sentAt: "2024-01-20 09:30"
    },
    {
      id: 2,
      title: "Promoção Plano Anual",
      channel: "E-mail",
      recipients: 150,
      sent: 150,
      delivered: 148,
      read: 89,
      status: "entregue",
      sentAt: "2024-01-19 14:00"
    },
    {
      id: 3,
      title: "Nova Modalidade: CrossFit",
      channel: "SMS",
      recipients: 200,
      sent: 200,
      delivered: 195,
      read: 0,
      status: "entregue",
      sentAt: "2024-01-18 16:45"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enviando": return "bg-blue-100 text-blue-800";
      case "entregue": return "bg-green-100 text-green-800";
      case "erro": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "WhatsApp": return <MessageCircle className="h-4 w-4 text-green-600" />;
      case "E-mail": return <Send className="h-4 w-4 text-blue-600" />;
      case "SMS": return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case "Instagram": return <Instagram className="h-4 w-4 text-pink-600" />;
      case "Facebook": return <Facebook className="h-4 w-4 text-blue-700" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <ResponsiveLayout 
      activeView="comunicacao" 
      onViewChange={() => {}} 
      title="Comunicação"
      subtitle="Gerencie sua comunicação multicanal"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Central de Comunicação</h2>
            <p className="text-muted-foreground">Envie mensagens para seus alunos e prospects</p>
          </div>
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Nova Mensagem
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2K</div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.2%</div>
              <p className="text-xs text-muted-foreground">Média dos últimos 30 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">67.4%</div>
              <p className="text-xs text-muted-foreground">+3.2% vs mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.5h</div>
              <p className="text-xs text-muted-foreground">Média de resposta</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="historico" className="w-full">
          <TabsList>
            <TabsTrigger value="historico">Histórico de Envios</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="automatizacao">Automação</TabsTrigger>
          </TabsList>
          
          <TabsContent value="historico" className="space-y-4">
            <div className="grid gap-4">
              {messages.map((message) => (
                <Card key={message.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(message.channel)}
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {message.title}
                            <Badge className={getStatusColor(message.status)}>
                              {message.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {message.channel} • Enviado em {message.sentAt}
                          </CardDescription>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Relatório
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Destinatários</p>
                        <p className="font-semibold">{message.recipients}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Enviadas</p>
                        <p className="font-semibold">{message.sent}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Entregues</p>
                        <p className="font-semibold">{message.delivered}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Lidas</p>
                        <p className="font-semibold">{message.read > 0 ? message.read : 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Templates de WhatsApp</CardTitle>
                  <CardDescription>Mensagens pré-configuradas para WhatsApp</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded">
                      <h4 className="font-medium">Lembrete de Aula</h4>
                      <p className="text-sm text-muted-foreground">Olá [nome]! Sua aula de [modalidade] está marcada para hoje às [horario].</p>
                    </div>
                    <div className="p-3 border rounded">
                      <h4 className="font-medium">Cobrança Amigável</h4>
                      <p className="text-sm text-muted-foreground">Olá [nome]! Sua mensalidade vence em [dias] dias. Que tal renovar?</p>
                    </div>
                    <div className="p-3 border rounded">
                      <h4 className="font-medium">Boas-vindas</h4>
                      <p className="text-sm text-muted-foreground">Bem-vindo(a) à nossa academia, [nome]! Estamos animados para ter você conosco!</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4">Gerenciar Templates</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Templates de E-mail</CardTitle>
                  <CardDescription>Mensagens para campanhas de e-mail</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded">
                      <h4 className="font-medium">Newsletter Mensal</h4>
                      <p className="text-sm text-muted-foreground">Novidades da academia, dicas de treino e promoções especiais.</p>
                    </div>
                    <div className="p-3 border rounded">
                      <h4 className="font-medium">Convite Aula Experimental</h4>
                      <p className="text-sm text-muted-foreground">Convide prospects para conhecer a academia com uma aula gratuita.</p>
                    </div>
                    <div className="p-3 border rounded">
                      <h4 className="font-medium">Promoção Especial</h4>
                      <p className="text-sm text-muted-foreground">Template para ofertas limitadas e descontos exclusivos.</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4">Gerenciar Templates</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="automatizacao" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fluxos de Automação</CardTitle>
                  <CardDescription>Configure mensagens automáticas baseadas em eventos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Sequência de Boas-vindas</h4>
                        <p className="text-muted-foreground">3 mensagens enviadas após matrícula</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Lembrete de Pagamento</h4>
                        <p className="text-muted-foreground">Aviso 5 dias antes do vencimento</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Reativação de Alunos</h4>
                        <p className="text-muted-foreground">Para alunos inativos há mais de 30 dias</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-800">Pausado</Badge>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Nurturing de Leads</h4>
                        <p className="text-muted-foreground">Sequência de 5 e-mails para prospects</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-4">Criar Nova Automação</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveLayout>
  );
}
