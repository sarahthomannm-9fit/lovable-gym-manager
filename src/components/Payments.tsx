
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CreditCard, Plus, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Payments() {
  const [payments, setPayments] = useState([
    {
      id: 1,
      student: "João Silva",
      value: 250.00,
      dueDate: "2024-01-20",
      status: "Pago",
      method: "PIX",
      paidDate: "2024-01-18"
    },
    {
      id: 2,
      student: "Maria Santos",
      value: 200.00,
      dueDate: "2024-01-25",
      status: "Pendente",
      method: "Cartão",
      paidDate: null
    },
    {
      id: 3,
      student: "Pedro Costa",
      value: 150.00,
      dueDate: "2024-01-15",
      status: "Atrasado",
      method: "PIX",
      paidDate: null
    },
    {
      id: 4,
      student: "Ana Paula",
      value: 300.00,
      dueDate: "2024-01-30",
      status: "Pendente",
      method: "Boleto",
      paidDate: null
    }
  ]);

  const [newPayment, setNewPayment] = useState({
    student: "",
    value: "",
    dueDate: "",
    method: ""
  });

  const { toast } = useToast();

  const handleAddPayment = () => {
    if (!newPayment.student || !newPayment.value || !newPayment.dueDate || !newPayment.method) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const payment = {
      id: payments.length + 1,
      ...newPayment,
      value: parseFloat(newPayment.value),
      status: "Pendente",
      paidDate: null
    };

    setPayments([...payments, payment]);
    setNewPayment({
      student: "",
      value: "",
      dueDate: "",
      method: ""
    });

    toast({
      title: "Sucesso",
      description: "Cobrança criada com sucesso!",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pago":
        return "bg-green-100 text-green-800";
      case "Pendente":
        return "bg-yellow-100 text-yellow-800";
      case "Atrasado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalPendente = payments
    .filter(p => p.status === "Pendente" || p.status === "Atrasado")
    .reduce((sum, p) => sum + p.value, 0);

  const totalRecebido = payments
    .filter(p => p.status === "Pago")
    .reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Pagamentos
          </h1>
          <p className="text-gray-600 mt-1">Gerencie cobranças e recebimentos</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Cobrança
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Cobrança</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="student">Aluno</Label>
                <Select value={newPayment.student} onValueChange={(value) => setNewPayment({...newPayment, student: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="João Silva">João Silva</SelectItem>
                    <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                    <SelectItem value="Pedro Costa">Pedro Costa</SelectItem>
                    <SelectItem value="Ana Paula">Ana Paula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="value">Valor (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={newPayment.value}
                  onChange={(e) => setNewPayment({...newPayment, value: e.target.value})}
                  placeholder="0,00"
                />
              </div>
              
              <div>
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newPayment.dueDate}
                  onChange={(e) => setNewPayment({...newPayment, dueDate: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="method">Método de Pagamento</Label>
                <Select value={newPayment.method} onValueChange={(value) => setNewPayment({...newPayment, method: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleAddPayment} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                Criar Cobrança
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-green-600" />
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalRecebido.toFixed(2).replace('.', ',')}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-yellow-600" />
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {totalPendente.toFixed(2).replace('.', ',')}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
              Em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {payments.filter(p => p.status === "Atrasado").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {payments.map((payment) => (
          <Card key={payment.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{payment.student}</CardTitle>
                <Badge className={getStatusColor(payment.status)}>
                  {payment.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Valor:</span>
                  <span className="font-semibold text-lg">
                    R$ {payment.value.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vencimento:</span>
                  <span className="text-sm">
                    {new Date(payment.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Método:</span>
                  <span className="text-sm">{payment.method}</span>
                </div>
                
                {payment.status === "Atrasado" && (
                  <div className="bg-red-50 p-2 rounded border border-red-200">
                    <p className="text-xs text-red-800">
                      Atrasado há {getDaysOverdue(payment.dueDate)} dias
                    </p>
                  </div>
                )}
                
                {payment.status === "Pago" && payment.paidDate && (
                  <div className="bg-green-50 p-2 rounded border border-green-200">
                    <p className="text-xs text-green-800">
                      Pago em {new Date(payment.paidDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2 mt-4">
                  {payment.status !== "Pago" && (
                    <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                      Marcar Pago
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                    Gerar Link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
