import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDataIntegration } from "@/components/DataIntegrationProvider";
import { Workflow, Bell, Mail, MessageCircle } from "lucide-react";

export default function AutomationDashboard() {
  const { notificacoes, loading } = useDataIntegration();

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;

  const enviadas = notificacoes.filter((n: any) => n.status === 'enviada').length;
  const pendentes = notificacoes.filter((n: any) => n.status === 'pendente').length;
  const lidas = notificacoes.filter((n: any) => n.status === 'lida').length;
  
  const porCanal = { email: 0, whatsapp: 0, push: 0, sistema: 0 };
  notificacoes.forEach((n: any) => {
    if (n.enviado_email) porCanal.email++;
    if (n.enviado_whatsapp) porCanal.whatsapp++;
    if (n.enviado_push) porCanal.push++;
    porCanal.sistema++;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Automação</h1>
        <p className="text-muted-foreground">Fluxos automáticos, notificações e execuções</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Bell className="h-4 w-4" />Total Notificações</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{notificacoes.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Enviadas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{enviadas}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pendentes</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-amber-600">{pendentes}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Lidas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{lidas}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" />Email</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{porCanal.email}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageCircle className="h-4 w-4" />WhatsApp</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{porCanal.whatsapp}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Workflow className="h-4 w-4" />Sistema</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{porCanal.sistema}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Notificações Recentes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {notificacoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma notificação registrada</p>
          ) : notificacoes.slice(0, 15).map((n: any) => (
            <div key={n.id} className="flex items-center justify-between p-2 rounded border text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={n.status === 'pendente' ? 'secondary' : n.status === 'enviada' ? 'default' : 'outline'} className="text-xs">{n.status}</Badge>
                <div>
                  <p className="font-medium">{n.titulo}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-md">{n.mensagem}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">{n.tipo}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
