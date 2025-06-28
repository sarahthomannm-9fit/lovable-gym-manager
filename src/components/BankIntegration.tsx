
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBankIntegration } from "@/hooks/useBankIntegration";
import { useStudents } from "@/hooks/useStudents";
import { useState } from "react";
import { CreditCard, Plus, Download, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function BankIntegration() {
  const { 
    account, 
    transactions, 
    connectBank, 
    importTransactions, 
    addManualTransaction,
    categorizeTransaction,
    updateTransactionStatus,
    getMonthlyRevenue,
    getRevenueByCategory
  } = useBankIntegration();
  const { students } = useStudents();
  const [manualEntry, setManualEntry] = useState({ 
    amount: '', 
    description: '', 
    category: '',
    type: 'credit' as 'credit' | 'debit'
  });
  const { toast } = useToast();

  const handleConnectBank = async () => {
    const result = await connectBank({});
    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Conta bancária conectada com sucesso!",
      });
    }
  };

  const handleImportTransactions = async () => {
    const newTransactions = await importTransactions();
    if (newTransactions.length > 0) {
      toast({
        title: "Transações Importadas",
        description: `${newTransactions.length} nova(s) transação(ões) importada(s)`,
      });
    } else {
      toast({
        title: "Nenhuma Transação Nova",
        description: "Não há novas transações para importar",
      });
    }
  };

  const handleManualEntry = () => {
    if (!manualEntry.amount || !manualEntry.description) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    addManualTransaction({
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(manualEntry.amount),
      description: manualEntry.description,
      type: manualEntry.type,
      category: manualEntry.category || undefined
    });

    setManualEntry({ amount: '', description: '', category: '', type: 'credit' });
    toast({
      title: "Sucesso",
      description: "Entrada manual registrada!",
    });
  };

  const handleCategorizeTransaction = (transactionId: string, category: string, studentId?: string) => {
    const student = studentId ? students.find(s => s.id.toString() === studentId) : undefined;
    categorizeTransaction(transactionId, category, student?.id, student?.name);
    
    toast({
      title: "Transação Categorizada",
      description: "Categoria atualizada com sucesso!",
    });
  };

  const monthlyRevenue = getMonthlyRevenue();
  const revenueByCategory = getRevenueByCategory();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Integração Bancária
          </h1>
          <p className="text-gray-600 mt-1">Conecte sua conta para importar receitas automaticamente</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Receita do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">R$ {monthlyRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Saldo Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              R$ {account?.balance?.toFixed(2) || '0,00'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Última Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-purple-800">
              {account?.lastSync ? new Date(account.lastSync).toLocaleDateString('pt-BR') : 'Nunca'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status da Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status da Conta</span>
            <Badge className={account?.connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {account?.connected ? "Conectada" : "Desconectada"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!account?.connected ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Conecte sua conta bancária para importar receitas automaticamente</p>
              <Button onClick={handleConnectBank} className="bg-gradient-to-r from-blue-500 to-green-500">
                Conectar Conta Bancária
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-sm text-gray-600">Sincronização ativa</p>
              </div>
              <Button onClick={handleImportTransactions} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Importar Transações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lançamento Manual */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamento Manual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={manualEntry.type} onValueChange={(value: 'credit' | 'debit') => setManualEntry({...manualEntry, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Receita</SelectItem>
                  <SelectItem value="debit">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={manualEntry.amount}
                onChange={(e) => setManualEntry({...manualEntry, amount: e.target.value})}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={manualEntry.description}
                onChange={(e) => setManualEntry({...manualEntry, description: e.target.value})}
                placeholder="Pagamento João Silva"
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={manualEntry.category}
                onChange={(e) => setManualEntry({...manualEntry, category: e.target.value})}
                placeholder="Aluno Fixo"
              />
            </div>
          </div>
          <Button onClick={handleManualEntry} className="mt-4 bg-gradient-to-r from-blue-500 to-green-500">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Entrada
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Transações */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{transaction.description}</p>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status === 'confirmed' ? 'Confirmado' : 
                         transaction.status === 'pending' ? 'Pendente' : 'Cancelado'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{new Date(transaction.date).toLocaleDateString('pt-BR')}</p>
                    {transaction.category && (
                      <p className="text-xs text-gray-500">Categoria: {transaction.category}</p>
                    )}
                    {transaction.studentName && (
                      <p className="text-xs text-blue-600">Aluno: {transaction.studentName}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'credit' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                    </p>
                    {transaction.status === 'pending' && (
                      <div className="flex space-x-2 mt-2">
                        <Select onValueChange={(value) => handleCategorizeTransaction(transaction.id, value)}>
                          <SelectTrigger className="w-32 text-xs">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Aluno Fixo">Aluno Fixo</SelectItem>
                            <SelectItem value="Aluno Novo">Aluno Novo</SelectItem>
                            <SelectItem value="Experimental">Experimental</SelectItem>
                            <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
