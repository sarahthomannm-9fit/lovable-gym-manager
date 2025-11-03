import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Send, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Building,
  Sparkles,
  Loader2
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentSpecialty {
  id: string;
  name: string;
  icon: any;
  description: string;
  color: string;
}

export function AIAgent() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("rh");
  const scrollRef = useRef<HTMLDivElement>(null);

  const agents: AgentSpecialty[] = [
    {
      id: 'rh',
      name: 'RH & Gestão de Pessoas',
      icon: Users,
      description: 'Especialista em gestão de equipe, recrutamento e desenvolvimento',
      color: 'text-blue-600'
    },
    {
      id: 'admin',
      name: 'Administração',
      icon: Building,
      description: 'Processos, finanças e organização administrativa',
      color: 'text-purple-600'
    },
    {
      id: 'comercial',
      name: 'Gestão Comercial',
      icon: Briefcase,
      description: 'Vendas, captação e retenção de clientes',
      color: 'text-green-600'
    },
    {
      id: 'marketing',
      name: 'Marketing',
      icon: TrendingUp,
      description: 'Estratégias de marketing e campanhas',
      color: 'text-orange-600'
    }
  ];

  const getAgentPrompt = (agentId: string) => {
    const prompts = {
      rh: "Você é um especialista em RH e gestão de pessoas. Analise os dados de funcionários, sugira melhorias em processos de RH e responda sobre gestão de equipe.",
      admin: "Você é um especialista em administração e processos. Analise dados financeiros, organize processos e otimize operações administrativas.",
      comercial: "Você é um especialista em vendas e gestão comercial. Analise dados de vendas, sugira estratégias de captação e retenção de clientes.",
      marketing: "Você é um especialista em marketing. Analise campanhas, sugira estratégias e otimize resultados de marketing."
    };
    return prompts[agentId as keyof typeof prompts] || prompts.marketing;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simular resposta da IA
    setTimeout(() => {
      const responses = {
        rh: [
          "Analisando seus dados de equipe... Recomendo implementar avaliações de desempenho trimestrais e um programa de desenvolvimento profissional.",
          "Com base nos check-ins, sugiro criar um sistema de reconhecimento para funcionários mais engajados.",
          "Para melhorar a retenção, considere implementar planos de carreira claros e benefícios flexíveis."
        ],
        admin: [
          "Seus processos administrativos podem ser otimizados. Recomendo automatizar o controle de pagamentos e relatórios financeiros.",
          "Analisando o fluxo de caixa, sugiro redistribuir vencimentos para equilibrar receitas mensais.",
          "Para melhor organização, implemente um sistema de categorização de despesas e receitas."
        ],
        comercial: [
          "Sua taxa de conversão está em 3.2%. Recomendo segmentar leads por interesse e implementar follow-ups automáticos.",
          "Para aumentar vendas, foque em upselling de alunos do plano básico com alta frequência.",
          "Implemente um programa de indicação com benefícios para alunos que trouxerem novos clientes."
        ],
        marketing: [
          "Suas campanhas têm ROI médio de 150%. Recomendo aumentar investimento nas de melhor performance.",
          "Para melhorar alcance, diversifique canais: Instagram, Google Ads e parcerias locais.",
          "Crie conteúdo educativo sobre fitness para gerar autoridade e atrair leads qualificados."
        ]
      };

      const agentResponses = responses[selectedAgent as keyof typeof responses] || responses.marketing;
      const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const currentAgent = agents.find(a => a.id === selectedAgent);
  const AgentIcon = currentAgent?.icon || Bot;

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Assistente IA Especializado
            </CardTitle>
            <CardDescription>
              Converse com especialistas de IA sobre seus dados
            </CardDescription>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            IA Ativa
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Seleção de Agente */}
        <Tabs value={selectedAgent} onValueChange={setSelectedAgent} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            {agents.map((agent) => {
              const Icon = agent.icon;
              return (
                <TabsTrigger key={agent.id} value={agent.id} className="flex items-center gap-1">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{agent.name.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <TabsContent key={agent.id} value={agent.id} className="mt-2">
                <div className="p-3 bg-muted rounded-lg flex items-start gap-3">
                  <Icon className={`h-5 w-5 ${agent.color} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.description}</p>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <AgentIcon className={`h-12 w-12 mx-auto mb-3 ${currentAgent?.color}`} />
                <p className="text-sm text-muted-foreground mb-2">
                  Olá! Sou seu assistente de {currentAgent?.name}.
                </p>
                <p className="text-xs text-muted-foreground">
                  Faça perguntas sobre {currentAgent?.description.toLowerCase()}.
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">Analisando...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Pergunte ao especialista em ${currentAgent?.name}...`}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
