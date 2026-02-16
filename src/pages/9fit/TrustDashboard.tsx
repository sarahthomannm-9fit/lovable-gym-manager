import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDataIntegration } from "@/components/DataIntegrationProvider";
import { Activity, AlertTriangle, TrendingUp } from "lucide-react";

export default function TrustDashboard() {
  const { avaliacoes, alunos, loading } = useDataIntegration();

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;

  const hoje = new Date().toISOString().split('T')[0];
  const avaliacoesMes = avaliacoes.filter((a: any) => a.created_at && a.created_at.slice(0, 7) === hoje.slice(0, 7));
  const pendentes = avaliacoes.filter((a: any) => a.proxima_avaliacao && a.proxima_avaliacao < hoje);
  const avgIMC = avaliacoes.length > 0 ? avaliacoes.filter((a: any) => a.imc).reduce((s: number, a: any) => s + (a.imc || 0), 0) / avaliacoes.filter((a: any) => a.imc).length : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trust Layer</h1>
        <p className="text-muted-foreground">Avaliações físicas, saúde e indicadores corporais</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Activity className="h-4 w-4" />Total Avaliações</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{avaliacoes.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Este Mês</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{avaliacoesMes.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Pendentes</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-amber-600">{pendentes.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" />IMC Médio</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{avgIMC.toFixed(1)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Avaliações Recentes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {avaliacoes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma avaliação registrada</p>
          ) : avaliacoes.slice(0, 10).map((av: any) => {
            const aluno = alunos.find((a: any) => a.id === av.aluno_id);
            return (
              <div key={av.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{aluno?.nome || 'Aluno'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(av.data_avaliacao).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex gap-2">
                  {av.peso && <Badge variant="outline">{av.peso}kg</Badge>}
                  {av.percentual_gordura && <Badge variant="outline">{av.percentual_gordura}% gordura</Badge>}
                  {av.imc && <Badge variant="secondary">IMC: {Number(av.imc).toFixed(1)}</Badge>}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
