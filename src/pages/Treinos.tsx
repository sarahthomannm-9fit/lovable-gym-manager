import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Treino {
  id: string;
  aluno_id: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  aluno?: {
    nome: string;
  };
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

  const fetchTreinos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('treinos')
        .select(`
          id,
          aluno_id,
          descricao,
          data_inicio,
          data_fim,
          alunos (nome)
        `)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      
      const treinosComAluno = data?.map(treino => ({
        ...treino,
        aluno: treino.alunos ? { nome: treino.alunos.nome } : undefined
      })) || [];
      
      setTreinos(treinosComAluno);
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os treinos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreinos();
  }, []);

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
          <p className="text-muted-foreground">
            Gerencie os treinos dos seus alunos.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Treino
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {treinos.map((treino) => {
          const classificacao = classificarTreino(treino.data_fim);
          return (
            <Card key={treino.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{treino.descricao}</CardTitle>
                  <Badge variant={classificacao.variant}>
                    {classificacao.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{treino.aluno?.nome || 'Aluno não encontrado'}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {new Date(treino.data_inicio).toLocaleDateString()} - {' '}
                      {new Date(treino.data_fim).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {treinos.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum treino encontrado</CardTitle>
            <CardDescription>
              Comece criando o primeiro treino para seus alunos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Treino
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}