import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, Send, Clock, Copy, Play, Pause, Phone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useWhatsApp } from "@/hooks/useWhatsApp";

export function WhatsAppFunnel() {
  const [isActive, setIsActive] = useState(true);
  const { toast } = useToast();
  const { sendMessage, isSending } = useWhatsApp();

  const copies = {
    inicial: `Oi! 👋 Tudo bem?

Estou entrando em contato porque vi que você tem interesse em começar na academia, é isso mesmo?

🎯 Tenho uma oportunidade incrível para você:
✅ 7 dias TOTALMENTE GRÁTIS
✅ Avaliação física completa  
✅ Treino personalizado
✅ Acompanhamento profissional

Seria do seu interesse? 

É só me responder que eu te explico tudo! 😊`,

    followup1: `Oi [NOME]! 

Não sei se você viu minha mensagem anterior... 📱

Estava te oferecendo 7 dias GRÁTIS na nossa academia.

É uma oportunidade única e temos poucas vagas disponíveis...

Você teria interesse? É só me falar "SIM" que eu te passo todos os detalhes! 

💪 Vamos começar sua transformação hoje?`,

    followup2: `[NOME], última chance! ⏰

Estou fechando as vagas para os 7 dias GRÁTIS hoje às 18h.

Já confirmaram 8 pessoas e só temos 10 vagas...

Você quer garantir a sua?

É literalmente sua última oportunidade de experimentar nossa metodologia sem pagar nada!

Me responde AGORA se você quer! 🔥`,

    objecoes: {
      tempo: `Entendo perfeitamente a questão do tempo! 

A boa notícia é que nossos treinos são SUPER otimizados:
⏰ 45 minutos por sessão (incluindo aquecimento)
📅 Apenas 3x por semana
🎯 Resultados comprovados em 30 dias

Muitos dos nossos alunos são pessoas super ocupadas como você!

Que tal experimentar os 7 dias grátis para ver como encaixa na sua rotina? 😊`,

      dinheiro: `Olha, entendo sua preocupação com investimento!

Mas pensa comigo: quanto você gasta por mês com:
💊 Remédios para dores nas costas?
🍔 Delivery por estar sem disposição pra cozinhar?
👔 Roupas maiores porque as antigas não servem mais?

Investir na sua saúde vai te ECONOMIZAR dinheiro a longo prazo!

E olha só: são apenas R$ 89/mês. Menos que 1 pizza por semana! 🍕

Quer conhecer nossas condições especiais?`,

      motivacao: `Cara, isso é SUPER normal! 

Sabe quantas pessoas chegam aqui dizendo exatamente isso? 😄

A diferença é que aqui você TEM motivação porque:
👥 Treina com pessoas que estão no mesmo processo
💪 Vê resultados rápidos (primeiros 15 dias)
🏆 Tem acompanhamento personalizado
📱 Recebe motivação diária pelo nosso app

O segredo não é TER motivação pra começar...
É começar para TER motivação! 

Topa experimentar os 7 dias grátis?`
    },

    fechamento: `PERFEITO! 🎉

Sua vaga está GARANTIDA para os 7 dias grátis!

PRÓXIMOS PASSOS:
1️⃣ Te cadastro no nosso sistema
2️⃣ Agendo sua avaliação física  
3️⃣ Te passo o endereço e horários
4️⃣ Você vem e começa a transformar sua vida!

Me passa só essas informações:
📝 Nome completo:
📞 Telefone:
📅 Melhor horário para treinar:
🎯 Seu principal objetivo:

Assim que me responder, está tudo certo! 💪`
  };

  const automationFlow = [
    {
      step: 1,
      trigger: "Lead entra na lista",
      delay: "Imediato",
      message: "inicial",
      status: "ativo"
    },
    {
      step: 2,
      trigger: "Não respondeu em 2h",
      delay: "2h",
      message: "followup1",
      status: "ativo"
    },
    {
      step: 3,
      trigger: "Não respondeu em 24h",
      delay: "24h",
      message: "followup2",
      status: "ativo"
    },
    {
      step: 4,
      trigger: "Enviou objeção",
      delay: "5 min",
      message: "Resposta personalizada",
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

  const testMessage = async () => {
    const result = await sendMessage({
      to: "+5511999999999",
      message: copies.inicial,
      type: "class_reminder"
    });
    
    if (result.success) {
      toast({
        title: "Teste enviado!",
        description: "Mensagem de teste foi enviada com sucesso",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle>Funil WhatsApp - Fitness</CardTitle>
                <CardDescription>
                  Conversational marketing com automação inteligente
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
              <Send className="h-5 w-5" />
              Fluxo de Automação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {automationFlow.map((flow) => (
                <div key={flow.step} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {flow.step}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{flow.trigger}</p>
                    <p className="text-sm text-muted-foreground">{flow.message}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {flow.delay}
                      </Badge>
                      <Badge variant={flow.status === "ativo" ? "default" : "secondary"} className="text-xs">
                        {flow.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Teste da Automação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-2">Preview da mensagem inicial:</p>
              <p className="text-sm text-muted-foreground line-clamp-6">
                {copies.inicial}
              </p>
            </div>
            
            <Button 
              onClick={testMessage}
              disabled={isSending}
              className="w-full"
            >
              {isSending ? "Enviando..." : "Testar Mensagem"}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold text-green-600">87%</p>
                <p className="text-xs text-muted-foreground">Taxa de Abertura</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">34%</p>
                <p className="text-xs text-muted-foreground">Taxa de Resposta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scripts de Conversação</CardTitle>
          <CardDescription>
            Mensagens otimizadas para cada etapa do funil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sequencia">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sequencia">Sequência Principal</TabsTrigger>
              <TabsTrigger value="objecoes">Tratamento de Objeções</TabsTrigger>
              <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
            </TabsList>

            <TabsContent value="sequencia" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Mensagem Inicial</label>
                  <div className="flex items-start space-x-2 mt-1">
                    <Textarea 
                      value={copies.inicial} 
                      readOnly 
                      className="resize-none h-40 text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(copies.inicial)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Follow-up 1 (2h depois)</label>
                  <div className="flex items-start space-x-2 mt-1">
                    <Textarea 
                      value={copies.followup1} 
                      readOnly 
                      className="resize-none h-32 text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(copies.followup1)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Follow-up 2 (24h depois)</label>
                  <div className="flex items-start space-x-2 mt-1">
                    <Textarea 
                      value={copies.followup2} 
                      readOnly 
                      className="resize-none h-32 text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(copies.followup2)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="objecoes" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Objeção: "Não tenho tempo"</label>
                  <div className="flex items-start space-x-2 mt-1">
                    <Textarea 
                      value={copies.objecoes.tempo} 
                      readOnly 
                      className="resize-none h-32 text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(copies.objecoes.tempo)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Objeção: "Está caro"</label>
                  <div className="flex items-start space-x-2 mt-1">
                    <Textarea 
                      value={copies.objecoes.dinheiro} 
                      readOnly 
                      className="resize-none h-40 text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(copies.objecoes.dinheiro)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Objeção: "Não tenho motivação"</label>
                  <div className="flex items-start space-x-2 mt-1">
                    <Textarea 
                      value={copies.objecoes.motivacao} 
                      readOnly 
                      className="resize-none h-40 text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(copies.objecoes.motivacao)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fechamento" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Script de Fechamento</label>
                <div className="flex items-start space-x-2 mt-1">
                  <Textarea 
                    value={copies.fechamento} 
                    readOnly 
                    className="resize-none h-48 text-sm"
                  />
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(copies.fechamento)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Alert>
        <MessageCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> O WhatsApp Business é essencial para automações. 
          Responda sempre em até 15 minutos no horário comercial e personalize as mensagens 
          com o nome do lead para aumentar a taxa de conversão.
        </AlertDescription>
      </Alert>
    </div>
  );
}