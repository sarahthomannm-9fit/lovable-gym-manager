
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
import { useGymData } from "@/contexts/GymDataContext";

export function Payments() {
  const { payments, students, addPayment, updatePayment, updateStudent } = useGymData();
  const { toast } = useToast();

  const [newPayment, setNewPayment] = useState({
    studentId: "",
    amount: "",
    dueDate: "",
    method: "" as 'pix' | 'card' | 'cash' | 'transfer'
  });

  const handleAddPayment = () => {
    if (!newPayment.studentId || !newPayment.amount || !newPayment.dueDate || !newPayment.method) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const student = students.find(s => s.id.toString() === newPayment.studentId);
    if (!student) return;

    addPayment({
      studentId: parseInt(newPayment.studentId),
      studentName: student.name,
      amount: parseFloat(newPayment.amount),
      date: new Date().toISOString().split('T')[0],
      method: newPayment.method,
      status: 'pending',
      plan: student.plan,
      dueDate: newPayment.dueDate
    });

    setNewPayment({
      studentId: "",
      amount: "",
      dueDate: "",
      method: "" as 'pix' | 'card' | 'cash' | 'transfer'
    });

    toast({
      title: "Sucesso",
      description: "Cobrança criada com sucesso!",
    });
  };

  const handleMarkAsPaid = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      updatePayment(paymentId, {
        status: 'confirmed',
        date: new Date().toISOString().split('T')[0]
      });
      
      // Update student payment status
      updateStudent(payment.studentId, {
        paymentStatus: 'up-to-date',
        daysOverdue: 0
      });

      toast({
        title: "Pagamento confirmado",
        description: `Pagamento de ${payment.studentName} foi confirmado`,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "Pago";
      case "pending": return "Pendente";
      case "cancelled": return "Cancelado";
      default: return status;
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
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRecebido = payments
    .filter(p => p.status === "confirmed")
    .reduce((sum, p) => sum + p.amount, 0);

  const overduePayments = payments.filter(p => {
    if (p.status === "confirmed") return false;
    if (!p.dueDate) return false;
    return getDaysOverdue(p.dueDate) > 0;
  });

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
                <Select value={newPayment.studentId} onValueChange={(value) => setNewPayment({...newPayment, studentId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="value">Valor (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
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
                <Select value={newPayment.method} onValueChange={(value: 'pix' | 'card' | 'cash' | 'transfer') => setNewPayment({...newPayment, method: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="card">Cartão de Crédito</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
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
              R$ {totalRecebido.toLocaleString()}
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
              R$ {totalPendente.toLocaleString()}
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
              {overduePayments.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {payments.map((payment) => (
          <Card key={payment.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{payment.studentName}</CardTitle>
                <Badge className={getStatusColor(payment.status)}>
                  {getStatusLabel(payment.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Valor:</span>
                  <span className="font-semibold text-lg">
                    R$ {payment.amount.toLocaleString()}
                  </span>
                </div>
                
                {payment.dueDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vencimento:</span>
                    <span className="text-sm">
                      {new Date(payment.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Método:</span>
                  <span className="text-sm capitalize">{payment.method}</span>
                </div>
                
                {payment.status === "pending" && payment.dueDate && getDaysOverdue(payment.dueDate) > 0 && (
                  <div className="bg-red-50 p-2 rounded border border-red-200">
                    <p className="text-xs text-red-800">
                      Atrasado há {getDaysOverdue(payment.dueDate)} dias
                    </p>
                  </div>
                )}
                
                {payment.status === "confirmed" && (
                  <div className="bg-green-50 p-2 rounded border border-green-200">
                    <p className="text-xs text-green-800">
                      Pago em {new Date(payment.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2 mt-4">
                  {payment.status !== "confirmed" && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleMarkAsPaid(payment.id)}
                    >
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

      {payments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum pagamento cadastrado</p>
          <p className="text-sm text-gray-400 mt-1">Crie sua primeira cobrança para começar</p>
        </div>
      )}
    </div>
  );
}
