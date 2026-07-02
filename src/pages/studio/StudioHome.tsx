import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useOperationalContext } from "@/hooks/useOperationalContext";
import { Dumbbell, Building2, TrendingUp, Users, Calendar, DollarSign } from "lucide-react";

export default function StudioHome() {
  const { activeOrg, ensureOrgForPersona } = useOperationalContext();
  const [org, setOrg] = useState<any>(null);
  const [dash, setDash] = useState<any>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [aulas, setAulas] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [semCheckin, setSemCheckin] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      let o = activeOrg;
      if (!o || !['professor','studio'].includes(o.tipo)) {
        o = await ensureOrgForPersona('studio') || await ensureOrgForPersona('professor');
      }
      setOrg(o);
      if (!o) return;
      const { data: dashData } = await (supabase as any).rpc("dashboard_sindico", { p_org_id: o.id });
      setDash(dashData);
      const [{ data: a }, { data: c }, { data: p }, { data: s }] = await Promise.all([
        supabase.from("alunos").select("id,nome,valor_mensalidade,lifecycle_status").eq("organization_id", o.id).limit(50),
        supabase.from("aulas").select("*").order("data_aula", { ascending: false }).limit(30),
        supabase.from("pagamentos").select("valor,data_pagamento,status").eq("status","pago").order("data_pagamento",{ascending:false}).limit(200),
        (supabase as any).rpc("get_alunos_sem_checkin", { p_dias: 15, p_org_id: o.id }),
      ]);
      setAlunos(a || []); setAulas(c || []); setPagamentos(p || []); setSemCheckin(s || []);
    })();
  }, [activeOrg?.id]);

  const kpis = useMemo(() => {
    const d = dash || {};
    return {
      ativos: d.alunos_ativos || alunos.filter(a => a.lifecycle_status === 'ativo').length,
      aulas: aulas.filter(x => x.data_aula >= new Date(Date.now() - 7*86400000).toISOString().slice(0,10)).length,
      receita: d.receita_mes || 0,
      ocupacao: d.ocupacao_media || 0,
    };
  }, [dash, alunos, aulas]);

  if (!org) return <div className="p-10 text-center text-muted-foreground">Selecione um estúdio para continuar.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center"><Dumbbell className="w-5 h-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-display font-bold">{org.nome}</h1>
          <Badge variant="outline" className="text-[10px]">{org.tipo === 'studio' ? 'Estúdio' : 'Academia'}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Users} label="Alunos ativos" value={kpis.ativos} />
        <Kpi icon={Calendar} label="Aulas 7d" value={kpis.aulas} />
        <Kpi icon={DollarSign} label="Receita mês" value={`R$ ${Number(kpis.receita).toLocaleString('pt-BR')}`} />
        <Kpi icon={TrendingUp} label="Ocupação" value={`${kpis.ocupacao}%`} />
      </div>

      <Tabs defaultValue="visao">
        <TabsList>
          <TabsTrigger value="visao">Visão Geral</TabsTrigger>
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="9fit">Falar com 9FIT</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="space-y-4 mt-4">
          <Card><CardContent className="p-4">
            <div className="text-xs font-mono uppercase text-primary/70 mb-2">Alunos em risco de churn (15+ dias sem check-in)</div>
            {semCheckin.length === 0 && <div className="text-xs text-muted-foreground">Todos em dia 🎉</div>}
            <div className="space-y-1">
              {semCheckin.slice(0, 10).map((a: any) => (
                <div key={a.aluno_id} className="flex justify-between text-sm py-1 border-b border-border/30">
                  <span>{a.nome}</span>
                  <span className="text-destructive font-mono text-xs">{a.dias_ausente}d</span>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="alunos" className="mt-4">
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs font-mono uppercase"><tr><th className="p-2 text-left">Nome</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Mensalidade</th></tr></thead>
              <tbody>{alunos.map(a => (
                <tr key={a.id} className="border-t border-border/50"><td className="p-2">{a.nome}</td><td className="p-2"><Badge variant="outline">{a.lifecycle_status}</Badge></td><td className="p-2 font-mono">R$ {Number(a.valor_mensalidade||0).toLocaleString('pt-BR')}</td></tr>
              ))}</tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="agenda" className="mt-4">
          <Card><CardContent className="p-4 space-y-2">
            {aulas.slice(0,15).map(a => (
              <div key={a.id} className="flex justify-between border-b border-border/30 py-2 text-sm">
                <span>{a.nome}</span>
                <span className="text-muted-foreground">{a.data_aula} · {a.horario_inicio}</span>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4">
          <Card><CardContent className="p-4">
            <div className="text-xs font-mono uppercase text-primary/70 mb-2">Últimos recebimentos</div>
            {pagamentos.slice(0,15).map((p, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-border/30">
                <span className="text-muted-foreground">{p.data_pagamento}</span>
                <span className="font-mono text-primary">R$ {Number(p.valor).toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="9fit" className="mt-4">
          <FalarCom9FIT orgId={org.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: any) {
  return <Card><CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
      <Icon className="w-3.5 h-3.5 text-primary/60" />
    </div>
    <div className="text-2xl font-display font-bold text-primary mt-1">{value}</div>
  </CardContent></Card>;
}

export function FalarCom9FIT({ orgId }: { orgId: string }) {
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("support_tickets").select("*").order("created_at",{ ascending: false }).limit(10);
    setTickets(data || []);
  };
  useEffect(() => { load(); }, []);

  const enviar = async () => {
    if (!assunto || !descricao) return;
    const { error } = await supabase.from("support_tickets").insert({ assunto, descricao, status: 'aberto', prioridade: 'normal' } as any);
    if (!error) { setAssunto(""); setDescricao(""); load(); }
  };

  return (
    <Card><CardContent className="p-4 space-y-3">
      <input className="w-full bg-background border border-border/50 rounded px-3 py-2 text-sm" placeholder="Assunto" value={assunto} onChange={e => setAssunto(e.target.value)} />
      <textarea className="w-full bg-background border border-border/50 rounded px-3 py-2 text-sm min-h-[100px]" placeholder="Descreva sua solicitação..." value={descricao} onChange={e => setDescricao(e.target.value)} />
      <Button variant="premium" size="sm" onClick={enviar}>Enviar para 9FIT</Button>
      <div className="pt-3 border-t border-border/30 space-y-2">
        <div className="text-xs font-mono uppercase text-primary/70">Meus tickets</div>
        {tickets.map(t => (
          <div key={t.id} className="text-sm border border-border/40 rounded p-2">
            <div className="flex justify-between"><span className="font-semibold">{t.assunto}</span><Badge variant="outline">{t.status}</Badge></div>
            <div className="text-xs text-muted-foreground mt-1">{t.descricao}</div>
          </div>
        ))}
      </div>
    </CardContent></Card>
  );
}
