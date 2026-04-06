import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useDataIntegration } from "@/components/DataIntegrationProvider";
import ReactMarkdown from "react-markdown";
import {
  Bot, Send, Users, Briefcase, TrendingUp, Building,
  Sparkles, Loader2, DollarSign, Settings2
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const agents = [
  { id: 'rh', name: 'RH', icon: Users, description: 'Gestão de equipe e instrutores', color: 'text-blue-500' },
  { id: 'admin', name: 'Admin', icon: Building, description: 'Processos e organização', color: 'text-purple-500' },
  { id: 'comercial', name: 'Comercial', icon: Briefcase, description: 'Vendas e retenção', color: 'text-green-500' },
  { id: 'marketing', name: 'Marketing', icon: TrendingUp, description: 'Campanhas e captação', color: 'text-orange-500' },
  { id: 'financeiro', name: 'Financeiro', icon: DollarSign, description: 'MRR, churn, inadimplência', color: 'text-emerald-500' },
  { id: 'operacoes', name: 'Operações', icon: Settings2, description: 'Aulas, frequência, automações', color: 'text-cyan-500' },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

export function AIAgent() {
  const { toast } = useToast();
  const {
    alunos: students, pagamentos: payments, planos: plans, aulas,
    checkins: checkIns, leads, experimentais, campanhas: campaigns,
  } = useDataIntegration();
  const assinaturas: any[] = []; // loaded separately if needed

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("comercial");
  const scrollRef = useRef<HTMLDivElement>(null);

  const buildContext = useCallback(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const ativos = (students || []).filter((s: any) => s.status === 'ativo');
    const mrr = ativos.reduce((s: number, a: any) => s + (a.valor_mensalidade || 0), 0);
    const vencidos = (payments || []).filter((p: any) => p.status !== 'pago' && p.data_vencimento < hoje);
    const totalInad = vencidos.reduce((s: number, p: any) => s + (p.valor || 0), 0);
    const checkinsHoje = (checkIns || []).filter((c: any) => c.data_checkin === hoje).length;
    const leadsNovos = (leads || []).filter((l: any) => l.status === 'novo').length;
    const aulasHoje = (aulas || []).filter((a: any) => a.data_aula === hoje).length;
    const expPendentes = (experimentais || []).filter((e: any) => e.status === 'agendada').length;

    return `
- Total alunos: ${(students || []).length} (${ativos.length} ativos)
- MRR: R$ ${mrr.toLocaleString('pt-BR')}
- Inadimplência: R$ ${totalInad.toLocaleString('pt-BR')} (${vencidos.length} pagamentos vencidos)
- Check-ins hoje: ${checkinsHoje}
- Aulas hoje: ${aulasHoje}
- Planos cadastrados: ${(plans || []).length}
- Leads novos: ${leadsNovos}
- Experimentais pendentes: ${expPendentes}
- Campanhas ativas: ${(campaigns || []).filter((c: any) => c.status === 'ativa').length}
- Assinaturas ativas: ${(assinaturas || []).filter((a: any) => a.status === 'ativa').length}
- Data: ${hoje}`.trim();
  }, [students, payments, plans, aulas, checkIns, leads, experimentais, campaigns, assinaturas]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          agentId: selectedAgent,
          context: buildContext(),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("Sem stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const upsert = (chunk: string) => {
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: assistantContent, timestamp: new Date() }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch { /* partial */ }
        }
      }
    } catch (e: any) {
      toast({ title: "Erro no agente IA", description: e.message, variant: "destructive" });
      if (!assistantContent) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), role: 'assistant',
          content: `⚠️ Erro: ${e.message}`, timestamp: new Date()
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const currentAgent = agents.find(a => a.id === selectedAgent)!;
  const AgentIcon = currentAgent.icon;

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Agente IA — {currentAgent.name}
            </CardTitle>
            <CardDescription>{currentAgent.description} · Dados reais do sistema</CardDescription>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            IA Real
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-3 overflow-hidden">
        <Tabs value={selectedAgent} onValueChange={(v) => { setSelectedAgent(v); setMessages([]); }}>
          <TabsList className="grid grid-cols-6 w-full">
            {agents.map(a => {
              const I = a.icon;
              return (
                <TabsTrigger key={a.id} value={a.id} className="flex items-center gap-1 text-xs">
                  <I className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">{a.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <AgentIcon className={`h-12 w-12 mx-auto mb-3 ${currentAgent.color}`} />
                <p className="text-sm text-muted-foreground mb-1">
                  Agente de <strong>{currentAgent.name}</strong> pronto
                </p>
                <p className="text-xs text-muted-foreground">
                  Pergunte sobre métricas, sugestões ou análises. Os dados reais do sistema são injetados automaticamente.
                </p>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                  <p className="text-xs opacity-60 mt-1">
                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Analisando dados...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={`Pergunte ao agente de ${currentAgent.name}...`}
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
