import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDataIntegration } from "@/components/DataIntegrationProvider";
import { ShoppingBag, DollarSign, TrendingUp } from "lucide-react";

export default function StoreDashboard() {
  const { produtos, loading } = useDataIntegration();

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;

  const ativos = produtos.filter((p: any) => p.status === 'ativo');
  const totalPreco = ativos.reduce((sum: number, p: any) => sum + (p.preco || 0), 0);
  const ticketMedio = ativos.length > 0 ? totalPreco / ativos.length : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Store 9FIT</h1>
        <p className="text-muted-foreground">Produtos, vendas e catálogo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><ShoppingBag className="h-4 w-4" />Produtos Ativos</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{ativos.length}</div><p className="text-xs text-muted-foreground">{produtos.length} total</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" />Preço Médio</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">R$ {ticketMedio.toFixed(0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" />Total Catálogo</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">R$ {totalPreco.toLocaleString('pt-BR')}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Catálogo de Produtos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {produtos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum produto cadastrado</p>
          ) : produtos.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">{p.nome}</p>
                <p className="text-sm text-muted-foreground">{p.tipo} • {p.descricao?.slice(0, 60) || ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={p.status === 'ativo' ? 'default' : 'secondary'}>{p.status}</Badge>
                {p.preco && <span className="font-bold">R$ {p.preco}</span>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
