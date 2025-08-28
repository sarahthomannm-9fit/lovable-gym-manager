import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Target, Zap, Copy, Play, Pause } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function GoogleFunnel() {
  const [isActive, setIsActive] = useState(true);
  const { toast } = useToast();

  const copies = {
    anuncio: {
      titulo1: "🔥 Academia Fitness - 7 Dias GRÁTIS",
      titulo2: "Transforme Seu Corpo em 30 Dias",
      descricao: "Plano personalizado + acompanhamento profissional. Resultados garantidos ou dinheiro de volta!"
    },
    landingPage: {
      headline: "Conquiste o Corpo dos Seus Sonhos em Apenas 30 Dias",
      subheadline: "Método comprovado que já transformou mais de 500 vidas. Sem dietas malucas, sem suplementos caros.",
      cta: "QUERO MINHA TRANSFORMAÇÃO GRÁTIS"
    },
    email: {
      assunto: "Sua transformação começa HOJE! 🔥",
      corpo: `Olá [NOME],

Parabéns! Você deu o primeiro passo para conquistar o corpo dos seus sonhos.

Seu acesso de 7 dias GRÁTIS está confirmado para:
✅ Treinos personalizados
✅ Acompanhamento nutricional
✅ Suporte via WhatsApp

PRÓXIMOS PASSOS:
1. Baixe nosso app FitManage Pro
2. Agende sua avaliação gratuita
3. Comece sua transformação hoje mesmo

[BOTÃO: ACESSAR MINHA CONTA]

Att,
Equipe FitManage Pro`
    }
  };

  const automations = [
    {
      trigger: "Lead preenche formulário",
      action: "Envio imediato de e-mail de boas-vindas",
      delay: "0 min",
      status: "ativo"
    },
    {
      trigger: "Não abriu e-mail em 2h",
      action: "SMS de lembrete enviado",
      delay: "2h",
      status: "ativo"
    },
    {
      trigger: "Não agendou em 24h",
      action: "WhatsApp automático + oferta urgência",
      delay: "24h",
      status: "ativo"
    },
    {
      trigger: "Não converteu em 7 dias",
      action: "Sequência de e-mails de reengajamento",
      delay: "7 dias",
      status: "ativo"
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Search className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Funil Google Ads - Fitness</CardTitle>
                <CardDescription>
                  Campanha otimizada para academias e personal trainers
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Ativo" : "Pausado"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsActive(!isActive)}
              >
                {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Processo do Funil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border-l-4 border-blue-500">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Google Ads → Landing Page</p>
                  <p className="text-sm text-muted-foreground">Anúncio com oferta irresistível</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border-l-4 border-green-500">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Captura de Lead</p>
                  <p className="text-sm text-muted-foreground">Formulário otimizado com 7 dias grátis</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 border-l-4 border-purple-500">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Sequência de E-mails</p>
                  <p className="text-sm text-muted-foreground">Nutrição automática por 7 dias</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50 border-l-4 border-orange-500">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <p className="font-medium">Conversão</p>
                  <p className="text-sm text-muted-foreground">Venda do plano no FitManage Pro</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Automações Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {automations.map((automation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Badge variant={automation.status === "ativo" ? "default" : "secondary"} className="mt-1">
                    {automation.delay}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{automation.trigger}</p>
                    <p className="text-sm text-muted-foreground">{automation.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Copies Otimizados</CardTitle>
          <CardDescription>
            Textos testados e aprovados para máxima conversão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="anuncio">
            <TabsList>
              <TabsTrigger value="anuncio">Anúncio Google</TabsTrigger>
              <TabsTrigger value="landing">Landing Page</TabsTrigger>
              <TabsTrigger value="email">E-mail Sequência</TabsTrigger>
            </TabsList>

            <TabsContent value="anuncio" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Título 1</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Textarea 
                      value={copies.anuncio.titulo1} 
                      readOnly 
                      className="resize-none h-8 text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(copies.anuncio.titulo1)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Título 2</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Textarea 
                      value={copies.anuncio.titulo2} 
                      readOnly 
                      className="resize-none h-8 text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(copies.anuncio.titulo2)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Textarea 
                      value={copies.anuncio.descricao} 
                      readOnly 
                      className="resize-none h-16 text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(copies.anuncio.descricao)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="landing" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Headline Principal</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Textarea 
                      value={copies.landingPage.headline} 
                      readOnly 
                      className="resize-none h-8 text-sm"
                    />
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(copies.landingPage.headline)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Sub-headline</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Textarea 
                      value={copies.landingPage.subheadline} 
                      readOnly 
                      className="resize-none h-12 text-sm"
                    />
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(copies.landingPage.subheadline)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Call-to-Action</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Textarea 
                      value={copies.landingPage.cta} 
                      readOnly 
                      className="resize-none h-8 text-sm"
                    />
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(copies.landingPage.cta)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Assunto</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Textarea 
                      value={copies.email.assunto} 
                      readOnly 
                      className="resize-none h-8 text-sm"
                    />
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(copies.email.assunto)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Corpo do E-mail</label>
                  <div className="flex items-start space-x-2 mt-1">
                    <Textarea 
                      value={copies.email.corpo} 
                      readOnly 
                      className="resize-none h-48 text-sm"
                    />
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(copies.email.corpo)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <strong>Configuração recomendada:</strong> Orçamento de R$ 50-100/dia para começar. 
          Segmente por localização (5km da academia) e interesses fitness. Use extensões de site e chamada.
        </AlertDescription>
      </Alert>
    </div>
  );
}