import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

const PERIODOS = [30, 90, 180, 365];

export default function InsightsMercado() {
  const [periodo, setPeriodo] = useState(30);
  const [mercado, setMercado] = useState("todos");
  const [alunos, setAlunos] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);

  useEffect(() => {
    const since = new Date(Date.now() - periodo * 86400000).toISOString();
    (async () => {
      const [{ data: a }, { data: o }, { data: p }, { data: av }] = await Promise.all([
        supabase.from("alunos").select("id, organization_id, lifecycle_status, valor_mensalidade, created_at"),
        (supabase as any).from("organizations").select("id, tipo"),
        supabase.from("pagamentos").select("valor, status, data_pagamento").gte("data_pagamento", since.slice(0,10)),
        supabase.from("avaliacoes_fisicas").select("id, created_at"),
      ]);
      setAlunos(a || []); setOrgs(o || []); setPagamentos(p || []); setAvaliacoes(av || []);
    })();
  }, [periodo]);

  const orgByTipo = (tipo: string) => new Set(orgs.filter(o => o.tipo === tipo).map(o => o.id));
  const filtrarAlunos = () => {
    if (mercado === 'todos') return alunos;
    const ids = orgByTipo(mercado);
    return alunos.filter(a => ids.has(a.organization_id));
  };
  const filteredAlunos = filtrarAlunos();
  const ativos = filteredAlunos.filter(a => a.lifecycle_status === 'ativo');
  const mrr = ativos.reduce((s, a) => s + Number(a.valor_mensalidade || 0), 0);
  const cancelados = filteredAlunos.filter(a => a.lifecycle_status === 'cancelado').length;
  const churn = filteredAlunos.length ? Math.round((cancelados / filteredAlunos.length) * 100) : 0;

  const receitaPeriodo = pagamentos.filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.valor), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Insights por Mercado</h1>
        <p className="text-sm text-muted-foreground">BI da assessoria 9FIT segmentado por mercado</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-mono text-muted-foreground mr-2">Período:</span>
        {PERIODOS.map(p => (
          <Button key={p} size="sm" variant={periodo === p ? 'premium' : 'outline'} onClick={() => setPeriodo(p)}>{p}d</Button>
        ))}
        <span className="text-xs font-mono text-muted-foreground ml-4 mr-2">Mercado:</span>
        {[{k:'todos',l:'Todos'},{k:'condominio',l:'Condomínios'},{k:'corporate',l:'Corporativo'},{k:'studio',l:'Estúdios'}].map(m => (
          <Button key={m.k} size="sm" variant={mercado === m.k ? 'premium' : 'outline'} onClick={() => setMercado(m.k)}>{m.l}</Button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={DollarSign} label="MRR" value={`R$ ${mrr.toLocaleString('pt-BR')}`} />
        <Kpi icon={Users} label="Alunos ativos" value={ativos.length} />
        <Kpi icon={TrendingUp} label="Taxa de churn" value={`${churn}%`} tone={churn > 10 ? 'destructive' : 'ok'} />
        <Kpi icon={Activity} label={`Receita ${periodo}d`} value={`R$ ${receitaPeriodo.toLocaleString('pt-BR')}`} />
      </div>

      <Card><CardContent className="p-4">
        <div className="text-xs font-mono uppercase text-primary/70 mb-3">Distribuição por mercado</div>
        <div className="space-y-2">
          {['condominio','corporate','studio','professor'].map(t => {
            const ids = orgByTipo(t);
            const count = alunos.filter(a => ids.has(a.organization_id) && a.lifecycle_status === 'ativo').length;
            const revenue = alunos.filter(a => ids.has(a.organization_id) && a.lifecycle_status === 'ativo').reduce((s,a) => s + Number(a.valor_mensalidade||0), 0);
            const pct = ativos.length ? Math.round((count / (mercado === 'todos' ? filteredAlunos.filter(a => a.lifecycle_status === 'ativo').length : ativos.length)) * 100) : 0;
            return (
              <div key={t} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{t}</span>
                  <span className="font-mono text-primary">{count} alunos · R$ {revenue.toLocaleString('pt-BR')}</span>
                </div>
                <div className="h-1.5 bg-muted rounded"><div className="h-full bg-primary rounded" style={{ width: `${pct}%` }}/></div>
              </div>
            );
          })}
        </div>
      </CardContent></Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: any) {
  return <Card><CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
      <Icon className="w-3.5 h-3.5 text-primary/60" />
    </div>
    <div className={`text-2xl font-display font-bold mt-1 ${tone === 'destructive' ? 'text-destructive' : 'text-primary'}`}>{value}</div>
  </CardContent></Card>;
}
