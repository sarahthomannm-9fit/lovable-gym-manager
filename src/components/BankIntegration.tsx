
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBankIntegration } from "@/hooks/useBankIntegration";
import { useState } from "react";
import { CreditCard, Plus, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function BankIntegration() {
  const { account, transactions, connectBank, importTransactions, addManualTransaction } = useBankIntegration();
  const [manualEntry, setManualEntry] = useState({ amount: '', description: '', category: '' });
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
      type: 'credit',
      category: manualEntry.category
    });

    setManualEntry({ amount: '', description: '', category: '' });
    toast({
      title: "Sucesso",
      description: "Entrada manual registrada!",
    });
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
              <Button onClick={importTransactions} variant="outline">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-600">{new Date(transaction.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'credit' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                    </p>
                    {transaction.category && (
                      <p className="text-xs text-gray-500">{transaction.category}</p>
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
