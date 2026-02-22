
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrainingStats } from "@/components/training/TrainingStats";
import { AddTrainingDialog } from "@/components/training/AddTrainingDialog";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";

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
  if (diffDias < 0) return { status: 'atrasado', variant: 'destructive' as const };
  if (diffDias <= 10) return { status: 'vencendo', variant: 'default' as const };
  return { status: 'em dia', variant: 'secondary' as const };
}

export function Treinos() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { students } = useSupabaseGymData();

  const fetchTreinos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('treinos')
        .select(`id, aluno_id, descricao, data_inicio, data_fim, alunos (nome)`)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      
      const treinosComAluno = data?.map(treino => ({
        ...treino,
        aluno: treino.alunos ? { nome: treino.alunos.nome } : undefined
      })) || [];
      
      setTreinos(treinosComAluno);
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      toast({ title: "Erro", description: "Não foi possível carregar os treinos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTreinos(); }, []);

  const trainingData = treinos.map(treino => ({
    id: treino.id,
    studentName: treino.aluno?.nome || 'Aluno não encontrado',
    description: treino.descricao || 'Sem descrição',
    startDate: treino.data_inicio,
    endDate: treino.data_fim,
    status: 'valid' as const
  }));

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Treinos</h1>
          <p className="text-muted-foreground">Carregando treinos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Treinos</h1>
          <p className="text-muted-foreground">Gerencie os treinos dos seus alunos e acompanhe o status.</p>
        </div>
        <AddTrainingDialog students={students} onSuccess={fetchTreinos} />
      </div>

      <TrainingStats trainings={trainingData} />

      <Card>
        <CardHeader>
          <CardTitle>Todos os Treinos</CardTitle>
          <CardDescription>Lista completa de treinos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {treinos.map((treino) => {
              const classificacao = classificarTreino(treino.data_fim);
              return (
                <Card key={treino.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{treino.descricao}</CardTitle>
                      <Badge variant={classificacao.variant}>{classificacao.status}</Badge>
                    </div>
                    <CardDescription className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{treino.aluno?.nome || 'Aluno não encontrado'}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(treino.data_inicio).toLocaleDateString()} - {new Date(treino.data_fim).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {treinos.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum treino encontrado</CardTitle>
            <CardDescription>Comece criando o primeiro treino para seus alunos.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddTrainingDialog 
              students={students} 
              onSuccess={fetchTreinos}
              trigger={
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Treino
                </button>
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
