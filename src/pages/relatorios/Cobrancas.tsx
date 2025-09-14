import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Plus, User, Users, Calendar, Send, Clock, AlertTriangle } from "lucide-react";

interface Cobranca {
  id: string;
  tipo: 'individual' | 'recorrente' | 'promocional';
  titulo: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_criacao: string;
  status: 'pendente' | 'enviada' | 'pago' | 'vencido';
  destinatario?: string;
  plano_id?: string;
  promocao_id?: string;
  metodo_envio: 'whatsapp' | 'email' | 'sms' | 'sistema';
  recorrencia?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
}

export function Cobrancas() {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [tipoCobranca, setTipoCobranca] = useState<'individual' | 'recorrente' | 'promocional'>('individual');
  const [novaCobranca, setNovaCobranca] = useState<Partial<Cobranca>>({
    tipo: 'individual',
    titulo: '',
    descricao: '',
    valor: 0,
    data_vencimento: '',
    metodo_envio: 'whatsapp',
    status: 'pendente'
  });
  const { toast } = useToast();

  // Dados simulados para demonstração
  const cobrancasDemo: Cobranca[] = [
    {
      id: '1',
      tipo: 'individual',
      titulo: 'Mensalidade Janeiro - João Silva',
      descricao: 'Cobrança da mensalidade do plano Premium',
      valor: 150,
      data_vencimento: '2024-01-10',
      data_criacao: '2024-01-01',
      status: 'enviada',
      destinatario: 'João Silva',
      metodo_envio: 'whatsapp'
    },
    {
      id: '2',
      tipo: 'recorrente',
      titulo: 'Mensalidades Plano Premium',
      descricao: 'Cobrança automática mensal para todos os alunos Premium',
      valor: 150,
      data_vencimento: '2024-01-10',
      data_criacao: '2023-12-01',
      status: 'enviada',
      metodo_envio: 'email',
      recorrencia: 'mensal'
    },
    {
      id: '3',
      tipo: 'promocional',
      titulo: 'Promoção Volta às Aulas',
      descricao: 'Oferta especial - 50% de desconto na primeira mensalidade',
      valor: 75,
      data_vencimento: '2024-02-01',
      data_criacao: '2024-01-15',
      status: 'pendente',
      metodo_envio: 'whatsapp'
    }
  ];

  useEffect(() => {
    // Simular carregamento dos dados
    setTimeout(() => {
      setCobrancas(cobrancasDemo);
      setLoading(false);
    }, 1000);
  }, []);

  const totalCobrancas = cobrancas.reduce((total, cobranca) => total + cobranca.valor, 0);
  const cobrancasPendentes = cobrancas.filter(c => c.status === 'pendente').length;
  const cobrancasEnviadas = cobrancas.filter(c => c.status === 'enviada').length;
  const cobrancasVencidas = cobrancas.filter(c => c.status === 'vencido').length;

  const handleAddCobranca = async () => {
    try {
      const cobranca: Cobranca = {
        ...novaCobranca as Cobranca,
        id: Date.now().toString(),
        data_criacao: new Date().toISOString().split('T')[0],
        tipo: tipoCobranca
      };
      
      setCobrancas([...cobrancas, cobranca]);
      setShowAddDialog(false);
      setNovaCobranca({
        tipo: 'individual',
        titulo: '',
        descricao: '',
        valor: 0,
        data_vencimento: '',
        metodo_envio: 'whatsapp',
        status: 'pendente'
      });

      toast({
        title: "Sucesso",
        description: "Cobrança criada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a cobrança",
        variant: "destructive",
      });
    }
  };

  const handleEnviarCobranca = (id: string) => {
    setCobrancas(cobrancas.map(c => 
      c.id === id ? { ...c, status: 'enviada' as const } : c
    ));
    toast({
      title: "Cobrança Enviada",
      description: "A cobrança foi enviada com sucesso!",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cobranças</h1>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-8 w-8 text-blue-500" />
            Gestão de Cobranças
          </h1>
          <p className="text-muted-foreground">
            Criação e gerenciamento de cobranças individuais, recorrentes e promocionais
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Cobrança
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Cobrança</DialogTitle>
              <DialogDescription>
                Configure uma nova cobrança para envio aos alunos
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={tipoCobranca} onValueChange={(value) => setTipoCobranca(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="individual">Individual</TabsTrigger>
                <TabsTrigger value="recorrente">Recorrente</TabsTrigger>
                <TabsTrigger value="promocional">Promocional</TabsTrigger>
              </TabsList>
              
              <TabsContent value="individual" className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="destinatario">Aluno</Label>
                    <Select value={novaCobranca.destinatario} onValueChange={(value) => setNovaCobranca({...novaCobranca, destinatario: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="João Silva">João Silva</SelectItem>
                        <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                        <SelectItem value="Pedro Costa">Pedro Costa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="recorrente" className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="plano">Plano</Label>
                    <Select value={novaCobranca.plano_id} onValueChange={(value) => setNovaCobranca({...novaCobranca, plano_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="basico">Básico</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="recorrencia">Recorrência</Label>
                    <Select value={novaCobranca.recorrencia} onValueChange={(value) => setNovaCobranca({...novaCobranca, recorrencia: value as any})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Frequência da cobrança" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="promocional" className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="promocao">Tipo de Promoção</Label>
                    <Select value={novaCobranca.promocao_id} onValueChange={(value) => setNovaCobranca({...novaCobranca, promocao_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a promoção" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desconto50">50% de Desconto</SelectItem>
                        <SelectItem value="blackfriday">Black Friday</SelectItem>
                        <SelectItem value="volta-aulas">Volta às Aulas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Campos comuns */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={novaCobranca.titulo}
                  onChange={(e) => setNovaCobranca({...novaCobranca, titulo: e.target.value})}
                  placeholder="Título da cobrança"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  value={novaCobranca.valor}
                  onChange={(e) => setNovaCobranca({...novaCobranca, valor: parseFloat(e.target.value)})}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={novaCobranca.data_vencimento}
                  onChange={(e) => setNovaCobranca({...novaCobranca, data_vencimento: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metodo_envio">Método de Envio</Label>
                <Select value={novaCobranca.metodo_envio} onValueChange={(value) => setNovaCobranca({...novaCobranca, metodo_envio: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="sistema">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={novaCobranca.descricao}
                  onChange={(e) => setNovaCobranca({...novaCobranca, descricao: e.target.value})}
                  placeholder="Descrição detalhada da cobrança..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddCobranca}>
                Criar Cobrança
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo das Cobranças */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {totalCobrancas.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {cobrancas.length} cobranças total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {cobrancasPendentes}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando envio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cobrancasEnviadas}
            </div>
            <p className="text-xs text-muted-foreground">
              Cobranças enviadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {cobrancasVencidas}
            </div>
            <p className="text-xs text-muted-foreground">
              Requer atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Cobranças */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cobranças</CardTitle>
          <CardDescription>Todas as cobranças criadas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cobrancas.map((cobranca) => (
              <div key={cobranca.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{cobranca.titulo}</p>
                    <Badge variant={
                      cobranca.tipo === 'individual' ? 'default' :
                      cobranca.tipo === 'recorrente' ? 'secondary' : 'outline'
                    }>
                      {cobranca.tipo === 'individual' ? 'Individual' :
                       cobranca.tipo === 'recorrente' ? 'Recorrente' : 'Promocional'}
                    </Badge>
                    <Badge variant={
                      cobranca.status === 'pago' ? 'default' :
                      cobranca.status === 'enviada' ? 'secondary' :
                      cobranca.status === 'pendente' ? 'outline' : 'destructive'
                    }>
                      {cobranca.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{cobranca.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {cobranca.destinatario && `Para: ${cobranca.destinatario} • `}
                    Vencimento: {new Date(cobranca.data_vencimento).toLocaleDateString('pt-BR')} • 
                    Via: {cobranca.metodo_envio}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-lg font-bold text-blue-600">
                    R$ {cobranca.valor.toLocaleString('pt-BR')}
                  </p>
                  {cobranca.status === 'pendente' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleEnviarCobranca(cobranca.id)}
                      className="ml-2"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Enviar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}