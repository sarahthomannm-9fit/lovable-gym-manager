import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataIntegration } from "@/components/DataIntegrationProvider";
import { Crown, DollarSign, Heart } from "lucide-react";

export default function ConciergeDashboard() {
  const { alunos, pagamentos, metrics, loading } = useDataIntegration();

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;

  // Alunos premium = top 20% por valor de mensalidade
  const alunosOrdenados = [...alunos].filter(a => a.status === 'ativo' && a.valor_mensalidade).sort((a, b) => (b.valor_mensalidade || 0) - (a.valor_mensalidade || 0));
  const topCount = Math.max(1, Math.ceil(alunosOrdenados.length * 0.2));
  const premium = alunosOrdenados.slice(0, topCount);
  
  const receitaPremium = premium.reduce((sum, a) => {
    const pagAluno = pagamentos.filter((p: any) => p.aluno_id === a.id && p.status === 'pago');
    return sum + pagAluno.reduce((s: number, p: any) => s + (p.valor || 0), 0);
  }, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Concierge Longevità</h1>
        <p className="text-muted-foreground">Gestão de clientes premium e serviço personalizado</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Crown className="h-4 w-4" />Clientes VIP</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{premium.length}</div><p className="text-xs text-muted-foreground">Top 20% por valor</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" />Receita VIP Total</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">R$ {receitaPremium.toLocaleString('pt-BR')}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Heart className="h-4 w-4" />LTV Médio</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">R$ {metrics.ltvMedio.toFixed(0)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Clientes Premium</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {premium.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum aluno cadastrado ainda</p>
          ) : premium.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">{a.nome}</p>
                <p className="text-sm text-muted-foreground">{a.email} • {a.telefone}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">R$ {(a.valor_mensalidade || 0).toLocaleString('pt-BR')}/mês</p>
                <p className="text-xs text-muted-foreground">{a.tipo || 'presencial'}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
