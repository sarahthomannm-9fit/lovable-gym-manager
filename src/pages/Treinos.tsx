import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, User, Calendar, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrainingStats } from "@/components/training/TrainingStats";
import { AddTrainingDialog } from "@/components/training/AddTrainingDialog";
import { PageShell } from "@/components/warroom/PageShell";
import { Button } from "@/components/ui/button";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { cn } from "@/lib/utils";

interface Treino {
  id: string;
  aluno_id: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  aluno?: { nome: string };
}

function classificarTreino(data_fim: string) {
  const hoje = new Date();
  const fim = new Date(data_fim);
  const diffDias = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDias < 0) return { status: 'Vencido', color: 'text-[hsl(var(--urgency-critical))]', variant: 'destructive' as const };
  if (diffDias <= 10) return { status: 'Vencendo', color: 'text-[hsl(var(--urgency-attention))]', variant: 'default' as const };
  return { status: 'Em dia', color: 'text-[hsl(var(--urgency-opportunity))]', variant: 'secondary' as const };
}

export function Treinos() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { students } = useSupabaseGymData();

  const fetchTreinos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('treinos').select(`id, aluno_id, descricao, data_inicio, data_fim, alunos (nome)`).order('data_inicio', { ascending: false });
      if (error) throw error;
      setTreinos(data?.map(t => ({ ...t, aluno: t.alunos ? { nome: t.alunos.nome } : undefined })) || []);
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      toast({ title: "Erro", description: "Não foi possível carregar os treinos", variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTreinos(); }, []);

  const hoje = new Date().toISOString().split('T')[0];
  const vencidos = treinos.filter(t => t.data_fim && t.data_fim < hoje).length;
  const vencendo = treinos.filter(t => { const d = Math.ceil((new Date(t.data_fim).getTime() - Date.now()) / 86400000); return d >= 0 && d <= 10; }).length;
  const emDia = treinos.length - vencidos - vencendo;
  const semTreino = students.filter(s => s.status === 'ativo' && !treinos.some(t => t.aluno_id === s.id)).length;

  const shellMetrics = [
    { label: 'TOTAL', value: String(treinos.length) },
    { label: 'EM DIA', value: String(emDia), color: 'text-[hsl(var(--urgency-opportunity))]' },
    { label: 'VENCENDO', value: String(vencendo), color: vencendo > 0 ? 'text-[hsl(var(--urgency-attention))]' : undefined },
    { label: 'VENCIDOS', value: String(vencidos), color: vencidos > 0 ? 'text-[hsl(var(--urgency-critical))]' : undefined },
    { label: 'SEM TREINO', value: String(semTreino), color: semTreino > 0 ? 'text-[hsl(var(--urgency-attention))]' : undefined },
  ];

  if (loading) {
    return (
      <PageShell title="TREINOS" sub="Carregando...">
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded" />)}</div>
      </PageShell>
    );
  }

  const trainingData = treinos.map(t => ({ id: t.id, studentName: t.aluno?.nome || 'N/A', description: t.descricao || '', startDate: t.data_inicio, endDate: t.data_fim, status: 'valid' as const }));

  return (
    <PageShell
      title="TREINOS"
      sub={`${treinos.length} treinos · ${vencidos} vencido(s)`}
      criticals={vencidos > 0 ? vencidos : undefined}
      metrics={shellMetrics}
      actions={<AddTrainingDialog students={students} onSuccess={fetchTreinos} />}
    >
      <TrainingStats trainings={trainingData} />

      {treinos.length === 0 ? (
        <Card className="mt-4"><CardContent className="py-12 text-center space-y-4">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="font-semibold">Nenhum treino cadastrado</p>
          <p className="text-sm text-muted-foreground">Crie o primeiro treino para seus alunos.</p>
          <AddTrainingDialog students={students} onSuccess={fetchTreinos} trigger={
            <Button><Plus className="h-4 w-4 mr-2" />Criar Primeiro Treino</Button>
          } />
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {treinos.map((treino) => {
            const cls = classificarTreino(treino.data_fim);
            return (
              <Card key={treino.id} className={cn(cls.status === 'Vencido' && 'border-l-4 border-l-[hsl(var(--urgency-critical))]')}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-medium text-sm truncate">{treino.descricao || 'Sem descrição'}</span>
                    <Badge variant={cls.variant} className="text-[10px] shrink-0">{cls.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" /><span>{treino.aluno?.nome || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(treino.data_inicio).toLocaleDateString('pt-BR')} – {new Date(treino.data_fim).toLocaleDateString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
