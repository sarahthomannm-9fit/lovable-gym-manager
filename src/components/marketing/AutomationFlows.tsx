import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Mail, 
  MessageSquare, 
  UserPlus, 
  Calendar,
  DollarSign,
  AlertTriangle
} from "lucide-react";

interface AutomationFlow {
  id: string;
  nome: string;
  tipo: 'onboarding' | 'reengajamento' | 'cobranca' | 'marketing';
  status: 'ativo' | 'pausado' | 'rascunho';
  gatilho: string;
  acoes: string[];
  executados: number;
  taxaSucesso: number;
}

export function AutomationFlows() {
  const { toast } = useToast();
  const [flows, setFlows] = useState<AutomationFlow[]>([
    {
      id: '1',
      nome: 'Boas-vindas Novo Aluno',
      tipo: 'onboarding',
      status: 'ativo',
      gatilho: 'Nova matrícula',
      acoes: ['Email boas-vindas', 'WhatsApp instruções', 'Agendar avaliação'],
      executados: 45,
      taxaSucesso: 92
    },
    {
      id: '2',
      nome: 'Alerta Pagamento Vencido',
      tipo: 'cobranca',
      status: 'ativo',
      gatilho: '1 dia após vencimento',
      acoes: ['WhatsApp lembrete', 'Email cobrança', 'Notificar gestor'],
      executados: 23,
      taxaSucesso: 78
    },
    {
      id: '3',
      nome: 'Reengajamento Inativo',
      tipo: 'reengajamento',
      status: 'pausado',
      gatilho: '7 dias sem check-in',
      acoes: ['WhatsApp motivacional', 'Oferta personal', 'Ligação'],
      executados: 12,
      taxaSucesso: 65
    },
    {
      id: '4',
      nome: 'Campanha Aniversário',
      tipo: 'marketing',
      status: 'ativo',
      gatilho: 'Aniversário aluno',
      acoes: ['Email parabéns', 'Desconto especial', 'Gift voucher'],
      executados: 8,
      taxaSucesso: 88
    }
  ]);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'onboarding': return <UserPlus className="h-4 w-4" />;
      case 'reengajamento': return <Zap className="h-4 w-4" />;
      case 'cobranca': return <DollarSign className="h-4 w-4" />;
      case 'marketing': return <Mail className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const handleToggleStatus = (id: string) => {
    setFlows(flows.map(f => 
      f.id === id 
        ? { ...f, status: f.status === 'ativo' ? 'pausado' : 'ativo' as const }
        : f
    ));
    toast({
      title: "Status Atualizado",
      description: "Fluxo de automação alterado com sucesso!",
    });
  };

  const handleDelete = (id: string) => {
    setFlows(flows.filter(f => f.id !== id));
    toast({
      title: "Fluxo Removido",
      description: "Automação excluída do sistema.",
      variant: "destructive",
    });
  };

  const activeFlows = flows.filter(f => f.status === 'ativo');
  const totalExecutions = flows.reduce((acc, f) => acc + f.executados, 0);
  const avgSuccess = flows.reduce((acc, f) => acc + f.taxaSucesso, 0) / flows.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Automação de Marketing
          </h2>
          <p className="text-muted-foreground">
            Gerencie fluxos automatizados de comunicação e ações
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fluxo
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fluxos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFlows.length}</div>
            <p className="text-xs text-muted-foreground">de {flows.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Execuções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions}</div>
            <p className="text-xs text-muted-foreground">no último mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{avgSuccess.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">média geral</p>
          </CardContent>
        </Card>
      </div>

      {/* Fluxos por Categoria */}
      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="reengajamento">Reengajamento</TabsTrigger>
          <TabsTrigger value="cobranca">Cobrança</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          {flows.map((flow) => (
            <Card key={flow.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTipoIcon(flow.tipo)}
                      <CardTitle className="text-lg">{flow.nome}</CardTitle>
                      <Badge variant={flow.status === 'ativo' ? 'default' : 'secondary'}>
                        {flow.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Gatilho: {flow.gatilho}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(flow.id)}
                    >
                      {flow.status === 'ativo' ? (
                        <><Pause className="h-4 w-4 mr-1" /> Pausar</>
                      ) : (
                        <><Play className="h-4 w-4 mr-1" /> Ativar</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(flow.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Ações Automatizadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {flow.acoes.map((acao, idx) => (
                        <Badge key={idx} variant="outline">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {acao}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Executados</p>
                      <p className="text-lg font-semibold">{flow.executados}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                      <p className="text-lg font-semibold text-green-600">{flow.taxaSucesso}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {['onboarding', 'reengajamento', 'cobranca', 'marketing'].map(tipo => (
          <TabsContent key={tipo} value={tipo} className="space-y-4">
            {flows.filter(f => f.tipo === tipo).map((flow) => (
              <Card key={flow.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTipoIcon(flow.tipo)}
                        <CardTitle className="text-lg">{flow.nome}</CardTitle>
                        <Badge variant={flow.status === 'ativo' ? 'default' : 'secondary'}>
                          {flow.status}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Gatilho: {flow.gatilho}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(flow.id)}
                      >
                        {flow.status === 'ativo' ? (
                          <><Pause className="h-4 w-4 mr-1" /> Pausar</>
                        ) : (
                          <><Play className="h-4 w-4 mr-1" /> Ativar</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(flow.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Ações Automatizadas:</p>
                      <div className="flex flex-wrap gap-2">
                        {flow.acoes.map((acao, idx) => (
                          <Badge key={idx} variant="outline">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {acao}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Executados</p>
                        <p className="text-lg font-semibold">{flow.executados}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                        <p className="text-lg font-semibold text-green-600">{flow.taxaSucesso}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
