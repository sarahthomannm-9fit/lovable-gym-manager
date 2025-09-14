import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownCircle, Plus, Building, Truck, Wrench, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Despesa {
  id: string;
  categoria: string;
  subcategoria: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado';
  fornecedor?: string;
  descricao: string;
  tipo: 'fixa' | 'variavel';
  recorrente: boolean;
}

export function FluxoPagamentos() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDespesa, setNewDespesa] = useState<Partial<Despesa>>({
    categoria: '',
    subcategoria: '',
    valor: 0,
    data_vencimento: '',
    descricao: '',
    tipo: 'fixa',
    recorrente: false,
    status: 'pendente'
  });
  const { toast } = useToast();

  // Dados simulados para demonstração (em produção viria do banco)
  const despesasDemo: Despesa[] = [
    {
      id: '1',
      categoria: 'Infraestrutura',
      subcategoria: 'Aluguel',
      valor: 3500,
      data_vencimento: '2024-01-10',
      data_pagamento: '2024-01-09',
      status: 'pago',
      fornecedor: 'Imobiliária Central',
      descricao: 'Aluguel da academia - Janeiro 2024',
      tipo: 'fixa',
      recorrente: true
    },
    {
      id: '2',
      categoria: 'Equipamentos',
      subcategoria: 'Manutenção',
      valor: 450,
      data_vencimento: '2024-01-15',
      status: 'pendente',
      fornecedor: 'TechFit Equipamentos',
      descricao: 'Manutenção esteiras e bicicletas',
      tipo: 'variavel',
      recorrente: false
    },
    {
      id: '3',
      categoria: 'Serviços',
      subcategoria: 'Energia Elétrica',
      valor: 890,
      data_vencimento: '2024-01-20',
      status: 'pendente',
      fornecedor: 'Companhia Elétrica',
      descricao: 'Conta de energia - Janeiro 2024',
      tipo: 'variavel',
      recorrente: true
    },
    {
      id: '4',
      categoria: 'Marketing',
      subcategoria: 'Publicidade Digital',
      valor: 1200,
      data_vencimento: '2024-01-25',
      status: 'pendente',
      fornecedor: 'Google Ads',
      descricao: 'Campanhas publicitárias - Janeiro',
      tipo: 'variavel',
      recorrente: true
    }
  ];

  useEffect(() => {
    // Simular carregamento dos dados
    setTimeout(() => {
      setDespesas(despesasDemo);
      setLoading(false);
    }, 1000);
  }, []);

  const categorias = [
    { value: 'infraestrutura', label: 'Infraestrutura', icon: Building },
    { value: 'equipamentos', label: 'Equipamentos', icon: Wrench },
    { value: 'servicos', label: 'Serviços', icon: Truck },
    { value: 'marketing', label: 'Marketing', icon: Calendar }
  ];

  const totalDespesas = despesas.reduce((total, despesa) => total + despesa.valor, 0);
  const despesasPagas = despesas.filter(d => d.status === 'pago').reduce((total, despesa) => total + despesa.valor, 0);
  const despesasPendentes = despesas.filter(d => d.status === 'pendente').reduce((total, despesa) => total + despesa.valor, 0);

  const dadosGrafico = categorias.map(cat => ({
    categoria: cat.label,
    valor: despesas
      .filter(d => d.categoria.toLowerCase() === cat.value)
      .reduce((total, despesa) => total + despesa.valor, 0)
  }));

  const dadosPizza = [
    { name: 'Pagas', value: despesasPagas, color: '#10b981' },
    { name: 'Pendentes', value: despesasPendentes, color: '#f59e0b' }
  ];

  const handleAddDespesa = async () => {
    try {
      // Em produção, salvaria no banco de dados
      const novaDespesa: Despesa = {
        ...newDespesa as Despesa,
        id: Date.now().toString()
      };
      
      setDespesas([...despesas, novaDespesa]);
      setShowAddDialog(false);
      setNewDespesa({
        categoria: '',
        subcategoria: '',
        valor: 0,
        data_vencimento: '',
        descricao: '',
        tipo: 'fixa',
        recorrente: false,
        status: 'pendente'
      });

      toast({
        title: "Sucesso",
        description: "Despesa adicionada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a despesa",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fluxo de Pagamentos</h1>
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
            <ArrowDownCircle className="h-8 w-8 text-red-500" />
            Fluxo de Pagamentos
          </h1>
          <p className="text-muted-foreground">
            Gestão de despesas fixas, variáveis e fornecedores
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Despesa</DialogTitle>
              <DialogDescription>
                Cadastre uma nova despesa no sistema
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={newDespesa.categoria} onValueChange={(value) => setNewDespesa({...newDespesa, categoria: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                    <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                    <SelectItem value="Serviços">Serviços</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Pessoal">Pessoal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="subcategoria">Subcategoria</Label>
                <Input
                  id="subcategoria"
                  value={newDespesa.subcategoria}
                  onChange={(e) => setNewDespesa({...newDespesa, subcategoria: e.target.value})}
                  placeholder="Ex: Aluguel, Manutenção..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  value={newDespesa.valor}
                  onChange={(e) => setNewDespesa({...newDespesa, valor: parseFloat(e.target.value)})}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={newDespesa.data_vencimento}
                  onChange={(e) => setNewDespesa({...newDespesa, data_vencimento: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Input
                  id="fornecedor"
                  value={newDespesa.fornecedor || ''}
                  onChange={(e) => setNewDespesa({...newDespesa, fornecedor: e.target.value})}
                  placeholder="Nome do fornecedor"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={newDespesa.tipo} onValueChange={(value: 'fixa' | 'variavel') => setNewDespesa({...newDespesa, tipo: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixa">Fixa</SelectItem>
                    <SelectItem value="variavel">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={newDespesa.descricao}
                  onChange={(e) => setNewDespesa({...newDespesa, descricao: e.target.value})}
                  placeholder="Descreva a despesa..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddDespesa}>
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo das Despesas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalDespesas.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {despesas.length} despesas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {despesasPagas.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {despesas.filter(d => d.status === 'pago').length} despesas pagas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <div className="h-4 w-4 bg-yellow-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {despesasPendentes.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {despesas.filter(d => d.status === 'pendente').length} despesas pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Distribuição de gastos por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']} />
                <Bar dataKey="valor" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Pagamentos</CardTitle>
            <CardDescription>Proporção de despesas pagas vs pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: R$ ${value.toLocaleString('pt-BR')}`}
                >
                  {dadosPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
          <CardDescription>Todas as despesas cadastradas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {despesas.map((despesa) => (
              <div key={despesa.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{despesa.categoria} - {despesa.subcategoria}</p>
                    <Badge variant={despesa.tipo === 'fixa' ? 'default' : 'secondary'}>
                      {despesa.tipo}
                    </Badge>
                    <Badge variant={
                      despesa.status === 'pago' ? 'default' :
                      despesa.status === 'pendente' ? 'secondary' : 'destructive'
                    }>
                      {despesa.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{despesa.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {despesa.fornecedor} • Vencimento: {new Date(despesa.data_vencimento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    R$ {despesa.valor.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}