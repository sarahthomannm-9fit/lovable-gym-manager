import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AGENTS = ['sdr', 'onboard', 'billing', 'content', 'suporte'] as const;
type Agent = typeof AGENTS[number];

const REPORT_PROMPTS: Record<Agent, string> = {
  sdr: `Você é o SDR Agent da 9FIT. Gere um relatório executivo curto (3-5 bullets) sobre os leads do dia: quantos novos, quantos qualificados, quais demandam ação amanhã. Use os dados fornecidos. Português brasileiro. Sem floreios.`,
  onboard: `Você é o Onboarding Agent da 9FIT. Gere um relatório curto (3-5 bullets) sobre alunos em onboarding: quantos novos hoje, alunos parados, próximos check-ins. Use os dados fornecidos. Português brasileiro.`,
  billing: `Você é o Billing Agent da 9FIT. Gere um relatório curto (3-5 bullets) sobre o financeiro do dia: pagos hoje, pendentes vencendo, inadimplentes acima de 7 dias. Use os dados fornecidos. Português brasileiro.`,
  content: `Você é o Content Agent da 9FIT. Gere um relatório curto (3-5 bullets) sobre conteúdo: drafts gerados, aprovados, pauta de amanhã. Use os dados fornecidos. Português brasileiro.`,
  suporte: `Você é o Suporte Agent da 9FIT. Gere um relatório curto (3-5 bullets) sobre tickets: abertos, resolvidos, escalados ao CEO. Use os dados fornecidos. Português brasileiro.`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return json({ error: 'LOVABLE_API_KEY ausente' }, 500);

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Collect metrics
    const [leadsRes, alunosRes, pagamentosRes, ticketsRes, draftsRes] = await Promise.all([
      supabase.from('leads').select('id, status, created_at, score'),
      supabase.from('alunos').select('id, status, lifecycle_status, data_matricula, created_at'),
      supabase.from('pagamentos').select('id, status, valor, data_vencimento, data_pagamento'),
      supabase.from('support_tickets').select('id, status, escalated_to_ceo, created_at, resolved_at'),
      supabase.from('content_drafts').select('id, status, type, created_at, approved_at'),
    ]);

    const leads = leadsRes.data || [];
    const alunos = alunosRes.data || [];
    const pagamentos = pagamentosRes.data || [];
    const tickets = ticketsRes.data || [];
    const drafts = draftsRes.data || [];

    const metricsByAgent: Record<Agent, any> = {
      sdr: {
        leads_total: leads.length,
        leads_novos_hoje: leads.filter((l: any) => l.created_at?.startsWith(today)).length,
        leads_qualificados: leads.filter((l: any) => l.status === 'qualificado').length,
        leads_convertidos: leads.filter((l: any) => l.status === 'convertido').length,
      },
      onboard: {
        alunos_ativos: alunos.filter((a: any) => a.status === 'ativo').length,
        novos_hoje: alunos.filter((a: any) => a.data_matricula === today).length,
        experimentais: alunos.filter((a: any) => a.lifecycle_status === 'experimental').length,
      },
      billing: {
        pagos_hoje: pagamentos.filter((p: any) => p.data_pagamento === today).length,
        valor_recebido_hoje: pagamentos.filter((p: any) => p.data_pagamento === today).reduce((s: number, p: any) => s + Number(p.valor || 0), 0),
        pendentes: pagamentos.filter((p: any) => p.status === 'pendente').length,
        inadimplentes: pagamentos.filter((p: any) => p.status !== 'pago' && p.data_vencimento && p.data_vencimento < today).length,
      },
      content: {
        drafts_total: drafts.length,
        drafts_hoje: drafts.filter((d: any) => d.created_at?.startsWith(today)).length,
        aprovados: drafts.filter((d: any) => d.status === 'approved').length,
        pendentes: drafts.filter((d: any) => d.status === 'pending_review').length,
      },
      suporte: {
        abertos: tickets.filter((t: any) => t.status === 'open').length,
        resolvidos_hoje: tickets.filter((t: any) => t.resolved_at?.startsWith(today)).length,
        escalados: tickets.filter((t: any) => t.escalated_to_ceo).length,
      },
    };

    const results: any[] = [];
    for (const agent of AGENTS) {
      const metrics = metricsByAgent[agent];
      const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: REPORT_PROMPTS[agent] },
            { role: 'user', content: `Dados do dia ${today}:\n${JSON.stringify(metrics, null, 2)}\n\nGere o relatório.` },
          ],
        }),
      });
      let summary = 'Relatório indisponível.';
      if (aiResp.ok) {
        const d = await aiResp.json();
        summary = d.choices?.[0]?.message?.content ?? summary;
      } else {
        console.error(`Report ${agent} failed:`, aiResp.status);
      }

      const { error } = await supabase.from('agent_reports').upsert({
        agent_id: agent,
        report_date: today,
        summary,
        metrics,
        highlights: [],
      }, { onConflict: 'agent_id,report_date' });
      if (error) console.error(`Save report ${agent} error:`, error);
      results.push({ agent, ok: !error });
    }

    return json({ success: true, date: today, results });
  } catch (err) {
    console.error('agent-daily-reports error:', err);
    return json({ error: String(err instanceof Error ? err.message : err) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
