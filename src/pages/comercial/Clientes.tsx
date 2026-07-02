import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building, Building2, Dumbbell, Briefcase, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOperationalContext } from "@/hooks/useOperationalContext";

const TIPO_META: Record<string, { icon: any; label: string; color: string }> = {
  condominio: { icon: Building2, label: "Condomínio", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  corporate: { icon: Briefcase, label: "Corporativo", color: "bg-violet-500/10 text-violet-500 border-violet-500/30" },
  corporativo: { icon: Briefcase, label: "Corporativo", color: "bg-violet-500/10 text-violet-500 border-violet-500/30" },
  professor: { icon: Dumbbell, label: "Coach", color: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  studio: { icon: Dumbbell, label: "Estúdio", color: "bg-orange-500/10 text-orange-500 border-orange-500/30" },
};

export default function Clientes() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [pagPend, setPagPend] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { setActiveOrg } = useOperationalContext();

  useEffect(() => {
    (async () => {
      const [{ data: o }, { data: a }, { data: p }] = await Promise.all([
        (supabase as any).from("organizations").select("*").eq("status", "ativo"),
        supabase.from("alunos").select("id, organization_id, valor_mensalidade, lifecycle_status"),
        supabase.from("pagamentos").select("id, aluno_id, valor, status, data_vencimento").eq("status", "pendente"),
      ]);
      setOrgs(o || []); setAlunos(a || []); setPagPend(p || []);
    })();
  }, []);

  const enriched = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return orgs.map(org => {
      const orgAlunos = alunos.filter(a => a.organization_id === org.id);
      const ativos = orgAlunos.filter(a => a.lifecycle_status === 'ativo');
      const mrr = ativos.reduce((s, a) => s + Number(a.valor_mensalidade || 0), 0);
      const alunoIds = new Set(orgAlunos.map(a => a.id));
      const inad = pagPend.filter(p => alunoIds.has(p.aluno_id) && p.data_vencimento < today).length;
      return { ...org, alunos_ativos: ativos.length, mrr, inad, status_op: inad === 0 ? 'saudavel' : 'atencao' };
    });
  }, [orgs, alunos, pagPend]);

  const filtered = enriched.filter(o => {
    if (filter !== "todos" && o.tipo !== filter) return false;
    if (search && !o.nome?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const metrics = {
    total: enriched.length,
    mrr: enriched.reduce((s, o) => s + o.mrr, 0),
    novos: enriched.filter(o => new Date(o.created_at).getMonth() === new Date().getMonth()).length,
  };

  const acessar = (org: any) => {
    setActiveOrg(org);
    if (org.tipo === 'condominio') navigate('/sindico');
    else if (org.tipo === 'corporate' || org.tipo === 'corporativo') navigate('/corp');
    else navigate('/studio');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Clientes Ativos</h1>
        <p className="text-sm text-muted-foreground">Organizações contratantes da assessoria 9FIT</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground font-mono uppercase">Total de clientes</div>
          <div className="text-2xl font-display font-bold text-primary">{metrics.total}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground font-mono uppercase">MRR total</div>
          <div className="text-2xl font-display font-bold text-primary">R$ {metrics.mrr.toLocaleString('pt-BR')}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground font-mono uppercase">Novos este mês</div>
          <div className="text-2xl font-display font-bold text-primary">{metrics.novos}</div>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[{k:'todos',l:'Todos'},{k:'condominio',l:'Condomínios'},{k:'corporate',l:'Corporativo'},{k:'studio',l:'Estúdios'},{k:'professor',l:'Coach'}].map(f => (
          <Button key={f.k} variant={filter === f.k ? 'premium' : 'outline'} size="sm" onClick={() => setFilter(f.k)}>{f.l}</Button>
        ))}
        <Input className="max-w-xs ml-auto" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(org => {
          const meta = TIPO_META[org.tipo] || TIPO_META.professor;
          const Icon = meta.icon;
          return (
            <Card key={org.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-lg">{org.nome}</div>
                      <Badge variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
                    </div>
                  </div>
                  <Badge className={org.status_op === 'saudavel' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'}>
                    {org.status_op === 'saudavel' ? 'Saudável' : 'Atenção'}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <Metric label="Alunos" value={org.alunos_ativos} />
                  <Metric label="MRR" value={`R$ ${org.mrr.toLocaleString('pt-BR')}`} />
                  <Metric label="Inadimp." value={org.inad} highlight={org.inad > 0} />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="premium" size="sm" onClick={() => acessar(org)}>
                    Acessar <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="md:col-span-2"><CardContent className="p-10 text-center text-muted-foreground">Nenhum cliente encontrado.</CardContent></Card>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }: any) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className={`text-sm font-display font-bold ${highlight ? 'text-destructive' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}
