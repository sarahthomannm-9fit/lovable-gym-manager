import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Instagram, Heart, MessageCircle, Share, Copy, Play, Pause } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function InstagramFunnel() {
  const [isActive, setIsActive] = useState(true);
  const { toast } = useToast();

  const copies = {
    posts: {
      transformacao: `🔥 TRANSFORMAÇÃO EM 30 DIAS! 

Veja o resultado da nossa aluna Maria:
❌ Antes: Sem disposição, 8kg acima do peso
✅ Depois: Corpo definido, autoestima nas alturas!

O segredo? Método científico + acompanhamento personalizado.

VOCÊ TAMBÉM QUER ESSA TRANSFORMAÇÃO?
👆 Comente "EU QUERO" que eu te mando o link da aula gratuita!

#transformacao #fitness #academia #emagrecimento`,

      dicas: `💡 3 ERROS que IMPEDEM você de emagrecer:

1️⃣ Treinar sem orientação profissional
2️⃣ Fazer dietas malucas que não funcionam
3️⃣ Não ter um plano estruturado

A SOLUÇÃO? ⬇️
✅ Treino personalizado
✅ Acompanhamento nutricional  
✅ Suporte 24h via WhatsApp

Quer descobrir como fazer isso acontecer?
💬 Me chama no direct que eu explico!

#dicasfitness #emagrecimento #academia`,

      urgencia: `🚨 ÚLTIMAS 24H! 

Promoção especial para os 50 primeiros:
🎯 7 dias GRÁTIS na melhor academia da cidade
🎯 Avaliação física completa
🎯 Plano alimentar personalizado
🎯 App exclusivo para acompanhar progresso

JÁ FORAM 47... SOBRAM APENAS 3 VAGAS!

📲 Clique no link da bio AGORA!
Ou comente "QUERO" que eu te chamo no direct

#promocao #academia #fitness #ultimas24h`
    },
    stories: [
      "Enquete: Qual seu maior desafio? A) Falta de tempo B) Falta de motivação",
      "Quiz: Quantos dias você treina por semana? A) 0-2 B) 3-4 C) 5+",
      "Pergunta: O que te impede de começar na academia hoje?",
      "CTA: Arrasta pra cima e descubra como perder 5kg em 30 dias!"
    ],
    dm: `Oi! 👋 

Vi que você se interessou pela nossa transformação de 30 dias!

Que incrível! ✨

Olha, eu tenho uma oportunidade especial para você:
🎯 7 dias de teste GRÁTIS
🎯 Avaliação física completa
🎯 Treino personalizado
🎯 Acompanhamento nutricional

Mas é só até amanhã e para poucas pessoas...

Você teria interesse? É só me falar "SIM" que eu te passo todos os detalhes! 

Ou se preferir, pode acessar direto aqui: [LINK]

Abraços! 💪`
  };

  const automations = [
    {
      trigger: "Comentário com 'EU QUERO'",
      action: "DM automático enviado",
      delay: "Imediato",
      status: "ativo"
    },
    {
      trigger: "Story com enquete respondida",
      action: "DM personalizado baseado na resposta",
      delay: "2 min",
      status: "ativo"
    },
    {
      trigger: "Curtiu últimos 3 posts",
      action: "DM com oferta especial",
      delay: "1h",
      status: "ativo"
    },
    {
      trigger: "Não respondeu DM em 24h",
      action: "Story com menção + oferta urgência",
      delay: "24h",
      status: "ativo"
    }
  ];

  const contentCalendar = [
    { day: "Segunda", type: "Transformação", engagement: "Alto" },
    { day: "Terça", type: "Dicas/Educativo", engagement: "Médio" },
    { day: "Quarta", type: "Behind the Scenes", engagement: "Médio" },
    { day: "Quinta", type: "Depoimento Cliente", engagement: "Alto" },
    { day: "Sexta", type: "Motivacional", engagement: "Alto" },
    { day: "Sábado", type: "Promoção/Oferta", engagement: "Muito Alto" },
    { day: "Domingo", type: "Lifestyle/Inspiração", engagement: "Médio" }
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
              <Instagram className="h-6 w-6 text-pink-600" />
              <div>
                <CardTitle>Funil Instagram - Fitness</CardTitle>
                <CardDescription>
                  Estratégia orgânica + DM automation para academias
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
              <Heart className="h-5 w-5" />
              Calendário de Conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contentCalendar.map((content, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{content.day}</p>
                    <p className="text-sm text-muted-foreground">{content.type}</p>
                  </div>
                  <Badge 
                    variant={
                      content.engagement === "Muito Alto" ? "default" :
                      content.engagement === "Alto" ? "secondary" : "outline"
                    }
                  >
                    {content.engagement}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Automações DM
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
          <CardTitle>Copies para Posts e Stories</CardTitle>
          <CardDescription>
            Conteúdos testados para máximo engajamento e conversão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="posts">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">Posts Feed</TabsTrigger>
              <TabsTrigger value="stories">Stories</TabsTrigger>
              <TabsTrigger value="dm">DM Automation</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Post de Transformação</label>
                  <div className="flex items-start space-x-2 mt-1">
                    <Textarea 
                      value={copies.posts.transformacao} 
                      readOnly 
                      className="resize-none h-48 text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(copies.posts.transformacao)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Post Educativo</label>
                  <div className="flex items-start space-x-2 mt-1">
                    <Textarea 
                      value={copies.posts.dicas} 
                      readOnly 
                      className="resize-none h-40 text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(copies.posts.dicas)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Post de Urgência</label>
                  <div className="flex items-start space-x-2 mt-1">
                    <Textarea 
                      value={copies.posts.urgencia} 
                      readOnly 
                      className="resize-none h-40 text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(copies.posts.urgencia)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stories" className="space-y-4">
              <div className="space-y-3">
                {copies.stories.map((story, index) => (
                  <div key={index}>
                    <label className="text-sm font-medium">Story {index + 1}</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Textarea 
                        value={story} 
                        readOnly 
                        className="resize-none h-12 text-sm"
                      />
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(story)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="dm" className="space-y-4">
              <div>
                <label className="text-sm font-medium">DM Automático</label>
                <div className="flex items-start space-x-2 mt-1">
                  <Textarea 
                    value={copies.dm} 
                    readOnly 
                    className="resize-none h-48 text-sm"
                  />
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(copies.dm)}
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
        <Instagram className="h-4 w-4" />
        <AlertDescription>
          <strong>Dica de ouro:</strong> Poste sempre no mesmo horário (19h-21h funciona bem), 
          use stories para enquetes e perguntas, e responda TODOS os comentários em até 30 minutos 
          para aumentar o alcance orgânico.
        </AlertDescription>
      </Alert>
    </div>
  );
}