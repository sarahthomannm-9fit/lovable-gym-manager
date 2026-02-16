import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ArrowLeft, TrendingUp, Weight, Ruler, Calendar, MessageCircle, FileText, DollarSign, Dumbbell, Activity } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useAvaliacoesFisicas } from "@/hooks/useAvaliacoesFisicas";
import { useSupabasePayments } from "@/hooks/useSupabasePayments";
import { useSupabaseCheckIns } from "@/hooks/useSupabaseCheckIns";
import { useFrequencia } from "@/hooks/useFrequencia";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

type SupabaseStudent = Tables<"alunos">;

interface StudentProfileProps {
  student: SupabaseStudent;
  onBack: () => void;
  planName?: string;
}

export function StudentProfile({ student, onBack, planName }: StudentProfileProps) {
  const { getAvaliacoesByAluno } = useAvaliacoesFisicas();
  const { payments } = useSupabasePayments();
  const { checkIns } = useSupabaseCheckIns();
  const { frequencias } = useFrequencia();
  const [treinos, setTreinos] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('treinos').select('*').eq('aluno_id', student.id).order('created_at', { ascending: false }).then(({ data }) => setTreinos(data || []));
  }, [student.id]);

  // Dados do aluno
  const avaliacoes = useMemo(() => getAvaliacoesByAluno(student.id), [student.id, getAvaliacoesByAluno]);
  const pagamentosAluno = useMemo(() => payments.filter(p => p.aluno_id === student.id), [payments, student.id]);
  const checkinsAluno = useMemo(() => checkIns.filter(c => c.aluno_id === student.id), [checkIns, student.id]);
  const frequenciasAluno = useMemo(() => frequencias.filter(f => f.aluno_id === student.id), [frequencias, student.id]);

  // Evolução física (dados reais)
  const evolucaoData = useMemo(() => {
    return avaliacoes
      .sort((a, b) => a.data_avaliacao.localeCompare(b.data_avaliacao))
      .map(av => ({
        date: new Date(av.data_avaliacao).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        weight: av.peso || 0,
        bodyFat: av.percentual_gordura || 0,
        muscle: av.massa_muscular || 0,
      }));
  }, [avaliacoes]);

  // Frequência mensal
  const frequenciaData = useMemo(() => {
    const meses: Record<string, number> = {};
    [...checkinsAluno, ...frequenciasAluno].forEach(c => {
      const data = (c as any).data_checkin || (c as any).data;
      if (data) {
        const mes = new Date(data).toLocaleDateString('pt-BR', { month: 'short' });
        meses[mes] = (meses[mes] || 0) + 1;
      }
    });
    return Object.entries(meses).map(([month, count]) => ({ month, visits: count }));
  }, [checkinsAluno, frequenciasAluno]);

  // Última avaliação
  const ultimaAv = avaliacoes[0];
  const currentWeight = ultimaAv?.peso || 0;
  const currentBodyFat = ultimaAv?.percentual_gordura || 0;
  const currentMuscle = ultimaAv?.massa_muscular || 0;

  // Pagamentos resumo
  const totalPago = pagamentosAluno.filter(p => p.status === 'pago').reduce((s, p) => s + (p.valor || 0), 0);
  const totalPendente = pagamentosAluno.filter(p => p.status === 'pendente').reduce((s, p) => s + (p.valor || 0), 0);

  const hoje = new Date().toISOString().split('T')[0];
  const treinoAtivo = treinos.find(t => !t.data_fim || t.data_fim >= hoje);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
            {student.nome}
          </h1>
          <p className="text-muted-foreground">{student.email} • {planName || student.tipo || 'Sem plano'}</p>
        </div>
        <Badge variant={student.status === 'ativo' ? 'default' : 'secondary'}>{student.status}</Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Weight className="h-4 w-4" />Peso</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeight ? `${currentWeight} kg` : '—'}</div>
            {evolucaoData.length > 1 && <p className="text-xs text-muted-foreground">{(currentWeight - evolucaoData[0].weight).toFixed(1)}kg desde início</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" />% Gordura</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentBodyFat ? `${currentBodyFat}%` : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Ruler className="h-4 w-4" />Massa Muscular</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMuscle ? `${currentMuscle} kg` : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />Check-ins</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkinsAluno.length + frequenciasAluno.length}</div>
            <p className="text-xs text-muted-foreground">total registrado</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resumo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="treinos">Treinos</TabsTrigger>
          <TabsTrigger value="frequencia">Frequência</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo">
          <Card>
            <CardHeader><CardTitle>Informações Pessoais</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Telefone</p><p className="font-medium">{student.telefone || '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Plano</p><p className="font-medium">{planName || student.tipo || '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Matrícula</p><p className="font-medium">{student.data_matricula ? new Date(student.data_matricula + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Mensalidade</p><p className="font-medium">{student.valor_mensalidade ? `R$ ${student.valor_mensalidade}` : '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Pagamento</p><p className="font-medium">{student.forma_pagamento || '—'}</p></div>
                {student.contato_emergencia && <div><p className="text-sm text-muted-foreground">Emergência</p><p className="font-medium">{student.contato_emergencia}</p></div>}
                {student.observacoes_medicas && <div className="col-span-2"><p className="text-sm text-muted-foreground">Observações Médicas</p><p className="font-medium">{student.observacoes_medicas}</p></div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolucao">
          {evolucaoData.length > 0 ? (
            <Card>
              <CardHeader><CardTitle>Evolução Física</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evolucaoData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} name="Peso (kg)" />
                    <Line type="monotone" dataKey="bodyFat" stroke="#EF4444" strokeWidth={2} name="% Gordura" />
                    <Line type="monotone" dataKey="muscle" stroke="#10B981" strokeWidth={2} name="Massa Muscular" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma avaliação física registrada para este aluno</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="financeiro">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" />Total Pago</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-600">R$ {totalPago.toLocaleString('pt-BR')}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" />Pendente</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-amber-600">R$ {totalPendente.toLocaleString('pt-BR')}</div></CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Histórico de Pagamentos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {pagamentosAluno.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhum pagamento registrado</p>
                ) : pagamentosAluno.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div>
                      <span className="font-medium">R$ {p.valor}</span>
                      <span className="text-muted-foreground ml-2">• {p.metodo_pagamento || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{p.data_vencimento ? new Date(p.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                      <Badge variant={p.status === 'pago' ? 'default' : 'secondary'}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="treinos">
          <div className="space-y-4">
            {treinoAtivo && (
              <Card className="border-primary">
                <CardHeader><CardTitle className="flex items-center gap-2"><Dumbbell className="h-5 w-5" />Treino Ativo</CardTitle></CardHeader>
                <CardContent>
                  <p>{treinoAtivo.descricao || 'Sem descrição'}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {treinoAtivo.data_inicio && `Início: ${new Date(treinoAtivo.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                    {treinoAtivo.data_fim && ` • Fim: ${new Date(treinoAtivo.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                  </p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle>Histórico de Treinos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {treinos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhum treino registrado</p>
                ) : treinos.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded border text-sm">
                    <span>{t.descricao || 'Treino'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {t.data_inicio ? new Date(t.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                      </span>
                      <Badge variant={!t.data_fim || t.data_fim >= hoje ? 'default' : 'secondary'}>
                        {!t.data_fim || t.data_fim >= hoje ? 'Ativo' : 'Vencido'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="frequencia">
          {frequenciaData.length > 0 ? (
            <Card>
              <CardHeader><CardTitle>Frequência Mensal</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={frequenciaData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Visitas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum check-in registrado para este aluno</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
