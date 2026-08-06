import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import {
  KpiCard, SectionHeader, DashboardSkeleton, DashboardError, DashboardEmpty, AIAdvisor, type Insight,
} from '@/components/dashboard/DashboardKit';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Users, DollarSign, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react';

const TIPOS: Record<string, { tipo: string; titulo: string; desc: string; persona: string }> = {
  condominios: { tipo: 'condominio', titulo: 'Condomínios', desc: 'Portaria eletrônica do fitness', persona: '/sindico' },
  corporativo: { tipo: 'corporate', titulo: 'Corporativo', desc: 'Saúde e performance nas empresas', persona: '/corp' },
  academias: { tipo: 'studio', titulo: 'Academias & Studios', desc: 'Operação de studios parceiros', persona: '/studio' },
  studios: { tipo: 'studio', titulo: 'Academias & Studios', desc: 'Operação de studios parceiros', persona: '/studio' },
  professores: { tipo: 'professor', titulo: 'Professores & Assessorias', desc: 'Coaches independentes', persona: '/coach' },
};

type Linha = {
  id: string; nome: string; status: string;
  alunos: number; ativos: number; receita: number; adesao: number; checkins: number;
};

export default function MercadoLista() {
  const { tipo = 'condominios' } = useParams();
  const navigate = useNavigate();
  const { setActiveOrg } = useOperationalContext();
  const cfg = TIPOS[tipo] || TIPOS.condominios;

  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
      const trintaAtras = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

      const { data: orgs, error: e1 } = await supabase
        .from('organizations').select('id, nome, tipo, status, metadata')
        .eq('tipo', cfg.tipo).order('nome');
      if (e1) throw e1;

      const orgIds = (orgs || []).map((o: any) => o.id);
      const { data: alunos } = orgIds.length
        ? await supabase.from('alunos').select('id, status, organization_id, valor_mensalidade').in('organization_id', orgIds)
        : { data: [] as any[] };

      const alunoIds = (alunos || []).map((a: any) => a.id);
      const [{ data: pagos }, { data: chs }] = await Promise.all([
        alunoIds.length
          ? supabase.from('pagamentos').select('valor, aluno_id').eq('status', 'pago').gte('data_pagamento', inicioMes).in('aluno_id', alunoIds)
          : Promise.resolve({ data: [] as any[] } as any),
        alunoIds.length
          ? supabase.from('checkins').select('aluno_id').gte('data_checkin', trintaAtras).in('aluno_id', alunoIds)
          : Promise.resolve({ data: [] as any[] } as any),
      ]);

      const orgDoAluno = new Map((alunos || []).map((a: any) => [a.id, a.organization_id]));

      const rows: Linha[] = (orgs || []).map((o: any) => {
        const meus = (alunos || []).filter((a: any) => a.organization_id === o.id);
        const ativos = meus.filter((a: any) => a.status === 'ativo').length;
        const receita = (pagos || []).filter((p: any) => orgDoAluno.get(p.aluno_id) === o.id)
          .reduce((s: number, p: any) => s + Number(p.valor || 0), 0);
        const checkins = (chs || []).filter((c: any) => orgDoAluno.get(c.aluno_id) === o.id).length;
        const base = Number((o.metadata as any)?.total_unidades || (o.metadata as any)?.unidades || meus.length || 0);
        return {
          id: o.id, nome: o.nome, status: o.status,
          alunos: meus.length, ativos, receita, checkins,
          adesao: base ? Math.round((ativos / base) * 100) : 0,
        };
      }).sort((a, b) => b.receita - a.receita);

      setLinhas(rows);
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar o mercado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); /* eslint-disable-next-line */ }, [cfg.tipo]);

  const totais = useMemo(() => ({
    orgs: linhas.length,
    alunos: linhas.reduce((s, l) => s + l.alunos, 0),
    ativos: linhas.reduce((s, l) => s + l.ativos, 0),
    receita: linhas.reduce((s, l) => s + l.receita, 0),
    checkins: linhas.reduce((s, l) => s + l.checkins, 0),
  }), [linhas]);

  const insights: Insight[] = useMemo(() => {
    const out: Insight[] = [];
    const fracas = linhas.filter((l) => l.adesao < 15);
    if (fracas.length) out.push({
      text: `${fracas.length} organização(ões) com adesão abaixo de 15% — oportunidade de campanha de ativação.`,
      tone: 'warning', actionLabel: 'Criar campanha', onAction: () => navigate('/marketing/campanhas'),
    });
    const semReceita = linhas.filter((l) => l.receita === 0 && l.ativos > 0);
    if (semReceita.length) out.push({
      text: `${semReceita.length} organização(ões) com alunos ativos e sem receita registrada no mês.`,
      tone: 'warning', actionLabel: 'Ver cobranças', onAction: () => navigate('/relatorios/cobrancas'),
    });
    if (linhas[0]) out.push({
      text: `Destaque do mercado: ${linhas[0].nome} lidera em receita com R$ ${linhas[0].receita.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}.`,
      tone: 'positive',
    });
    return out;
  }, [linhas, navigate]);

  const abrir = async (l: Linha) => {
    const { data } = await supabase.from('organizations').select('id, nome, tipo, status').eq('id', l.id).maybeSingle();
    if (data) setActiveOrg(data as any);
    navigate(cfg.persona);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold font-display">{cfg.titulo}</h1>
          <p className="text-sm text-muted-foreground mt-1">{cfg.desc}</p>
        </div>
        <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </header>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <DashboardError message={error} onRetry={carregar} />
      ) : linhas.length === 0 ? (
        <DashboardEmpty
          title="Nenhuma organização neste mercado"
          message="Cadastre uma organização para começar a acompanhar os indicadores."
          actionLabel="Ir para Organizações"
          onAction={() => navigate('/admin/organizacoes')}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Organizações" value={totais.orgs} icon={Building2} />
            <KpiCard label="Alunos ativos" value={totais.ativos} hint={`${totais.alunos} cadastrados`} icon={Users} />
            <KpiCard label="Receita do mês"
                     value={`R$ ${totais.receita.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} icon={DollarSign} />
            <KpiCard label="Check-ins (30d)" value={totais.checkins} icon={TrendingUp} />
          </div>

          <AIAdvisor insights={insights} title="Oportunidades e alertas" />

          <section>
            <SectionHeader title="Ranking de organizações" description="Ordenado por receita do mês" />
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Organização</TableHead>
                      <TableHead className="text-right">Alunos ativos</TableHead>
                      <TableHead className="text-right">Adesão</TableHead>
                      <TableHead className="text-right">Check-ins 30d</TableHead>
                      <TableHead className="text-right">Receita mês</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.map((l, i) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">
                          {l.nome}{' '}
                          {l.status !== 'ativo' && <Badge variant="outline" className="ml-1 text-[10px]">{l.status}</Badge>}
                        </TableCell>
                        <TableCell className="text-right">{l.ativos}</TableCell>
                        <TableCell className={`text-right ${l.adesao < 15 ? 'text-amber-400' : ''}`}>{l.adesao}%</TableCell>
                        <TableCell className="text-right">{l.checkins}</TableCell>
                        <TableCell className="text-right">R$ {l.receita.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => abrir(l)}>
                            Abrir <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
