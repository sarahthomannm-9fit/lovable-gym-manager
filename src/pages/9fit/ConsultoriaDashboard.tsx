import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataIntegration } from "@/components/DataIntegrationProvider";
import { Badge } from "@/components/ui/badge";
import { Users, Dumbbell, AlertTriangle, TrendingUp } from "lucide-react";

export default function ConsultoriaDashboard() {
  const { alunos, treinos, metrics, loading } = useDataIntegration();

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;

  const hoje = new Date().toISOString().split('T')[0];
  const alunosComTreino = new Set(treinos.filter((t: any) => !t.data_fim || t.data_fim >= hoje).map((t: any) => t.aluno_id));
  const alunosSemTreino = alunos.filter(a => a.status === 'ativo' && !alunosComTreino.has(a.id));
  const treinosVencidos = treinos.filter((t: any) => t.data_fim && t.data_fim < hoje);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Consultoria Fitness</h1>
        <p className="text-muted-foreground">Gestão de alunos, treinos e aderência</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" />Alunos Ativos</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{metrics.alunosAtivos}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Dumbbell className="h-4 w-4" />Com Treino Ativo</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{alunosComTreino.size}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Sem Treino</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-destructive">{alunosSemTreino.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" />Inativos (15d)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-amber-600">{metrics.alunosInativos}</div></CardContent>
        </Card>
      </div>

      {/* Risco de saída */}
      {metrics.churnRisk.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Alunos com Risco de Saída</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {metrics.churnRisk.slice(0, 10).map(aluno => (
              <div key={aluno.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{aluno.nome}</p>
                  <div className="flex gap-1 mt-1">
                    {aluno.motivos.map((m, i) => <Badge key={i} variant="secondary" className="text-xs">{m}</Badge>)}
                  </div>
                </div>
                <Badge variant={aluno.motivos.length >= 2 ? 'destructive' : 'secondary'}>
                  {aluno.motivos.length >= 2 ? 'Alto risco' : 'Atenção'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Treinos vencidos */}
      {treinosVencidos.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Treinos Vencidos ({treinosVencidos.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {treinosVencidos.slice(0, 10).map((t: any) => {
              const aluno = alunos.find(a => a.id === t.aluno_id);
              return (
                <div key={t.id} className="flex items-center justify-between p-2 rounded border text-sm">
                  <span>{aluno?.nome || 'Aluno não encontrado'}</span>
                  <span className="text-muted-foreground">Venceu: {new Date(t.data_fim).toLocaleDateString('pt-BR')}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
