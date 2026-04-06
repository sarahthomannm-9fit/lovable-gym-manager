import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENT_PROMPTS: Record<string, string> = {
  rh: `Você é o Agente de RH e Gestão de Pessoas do FitManager 9FIT. Você analisa dados reais do sistema para:
- Avaliar produtividade e alocação de instrutores
- Sugerir escalas e redistribuição de aulas
- Identificar gaps de cobertura em horários
- Recomendar contratações baseado em demanda
Responda sempre em português brasileiro, com dados específicos quando fornecidos no contexto.`,

  admin: `Você é o Agente de Administração do FitManager 9FIT. Você analisa dados reais do sistema para:
- Otimizar processos operacionais
- Identificar ineficiências de custo
- Sugerir melhorias na organização
- Avaliar equipamentos e infraestrutura
Responda sempre em português brasileiro, seja direto e pragmático.`,

  comercial: `Você é o Agente Comercial do FitManager 9FIT. Você analisa dados reais do sistema para:
- Avaliar pipeline de vendas e conversão de leads
- Sugerir estratégias de captação e retenção
- Identificar oportunidades de upsell
- Analisar taxa de conversão de aulas experimentais
Responda sempre em português brasileiro, com foco em ações concretas.`,

  marketing: `Você é o Agente de Marketing do FitManager 9FIT. Você analisa dados reais do sistema para:
- Avaliar performance de campanhas e ROI
- Sugerir segmentação de público
- Recomendar canais e mensagens
- Identificar padrões de aquisição
Responda sempre em português brasileiro, com sugestões práticas.`,

  financeiro: `Você é o Agente Financeiro do FitManager 9FIT. Você analisa dados reais do sistema para:
- Projetar MRR, churn e LTV
- Identificar riscos de inadimplência
- Sugerir estratégias de cobrança
- Analisar fluxo de caixa e saúde financeira
Responda sempre em português brasileiro, com números e projeções.`,

  operacoes: `Você é o Agente de Operações do FitManager 9FIT. Você analisa dados reais do sistema para:
- Monitorar ocupação de aulas e eficiência operacional
- Identificar gargalos no dia a dia
- Sugerir automações e otimizações
- Avaliar métricas de retenção e frequência
Responda sempre em português brasileiro, foco em eficiência.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, agentId, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const agentPrompt = AGENT_PROMPTS[agentId] || AGENT_PROMPTS.comercial;

    const systemContent = `${agentPrompt}

## CONTEXTO ATUAL DO SISTEMA (dados reais):
${context || 'Sem dados de contexto disponíveis.'}

Sempre que possível, referencie os dados acima nas suas respostas. Se o usuário perguntar sobre métricas, use os dados reais fornecidos. Formate com markdown para melhor legibilidade.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("agent-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
