
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
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";

export function SupabasePayments() {
  const { payments, students, addPayment, updatePayment } = useSupabaseGymData();
  const { toast } = useToast();

  const [newPayment, setNewPayment] = useState({
    studentId: "",
    amount: "",
    dueDate: "",
    method: "" as 'pix' | 'cartao' | 'dinheiro' | 'transferencia'
  });

  const handleAddPayment = async () => {
    if (!newPayment.studentId || !newPayment.amount || !newPayment.dueDate || !newPayment.method) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const student = students.find(s => s.id === newPayment.studentId);
    if (!student) return;

    try {
      const currentDate = new Date();
      const referenceMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;

      await addPayment({
        aluno_id: newPayment.studentId,
        valor: parseFloat(newPayment.amount),
        data_vencimento: newPayment.dueDate,
        metodo_pagamento: newPayment.method,
        status: 'pendente',
        referencia_mes: referenceMonth
      });

      setNewPayment({
        studentId: "",
        amount: "",
        dueDate: "",
        method: "" as 'pix' | 'cartao' | 'dinheiro' | 'transferencia'
      });

      toast({
        title: "Sucesso",
        description: "Cobrança criada com sucesso!",
      });
    } catch (error) {
      console.error('Failed to add payment:', error);
    }
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      await updatePayment(paymentId, {
        status: 'pago',
        data_pagamento: new Date().toISOString().split('T')[0]
      });

      toast({
        title: "Pagamento confirmado",
        description: "Pagamento foi confirmado com sucesso",
      });
    } catch (error) {
      console.error('Failed to update payment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "bg-green-100 text-green-800";
      case "pendente":
        return "bg-yellow-100 text-yellow-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      case "atrasado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pago": return "Pago";
      case "pendente": return "Pendente";
      case "cancelado": return "Cancelado";
      case "atrasado": return "Atrasado";
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
    .filter(p => p.status === "pendente")
    .reduce((sum, p) => sum + Number(p.valor), 0);

  const totalRecebido = payments
    .filter(p => p.status === "pago")
    .reduce((sum, p) => sum + Number(p.valor), 0);

  const overduePayments = payments.filter(p => {
    if (p.status === "pago") return false;
    if (!p.data_vencimento) return false;
    return getDaysOverdue(p.data_vencimento) > 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Pagamentos (Supabase)
          </h1>
          <p className="text-gray-600 mt-1">Gerencie cobranças e recebimentos conectados ao banco de dados</p>
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
                      <SelectItem key={student.id} value={student.id}>
                        {student.nome}
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
                <Select value={newPayment.method} onValueChange={(value: 'pix' | 'cartao' | 'dinheiro' | 'transferencia') => setNewPayment({...newPayment, method: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
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
        {payments.map((payment) => {
          const student = students.find(s => s.id === payment.aluno_id);
          return (
            <Card key={payment.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{student?.nome || 'Aluno não encontrado'}</CardTitle>
                  <Badge className={getStatusColor(payment.status || 'pendente')}>
                    {getStatusLabel(payment.status || 'pendente')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor:</span>
                    <span className="font-semibold text-lg">
                      R$ {Number(payment.valor).toLocaleString()}
                    </span>
                  </div>
                  
                  {payment.data_vencimento && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Vencimento:</span>
                      <span className="text-sm">
                        {new Date(payment.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Método:</span>
                    <span className="text-sm capitalize">{payment.metodo_pagamento || 'Não informado'}</span>
                  </div>
                  
                  {payment.status === "pendente" && payment.data_vencimento && getDaysOverdue(payment.data_vencimento) > 0 && (
                    <div className="bg-red-50 p-2 rounded border border-red-200">
                      <p className="text-xs text-red-800">
                        Atrasado há {getDaysOverdue(payment.data_vencimento)} dias
                      </p>
                    </div>
                  )}
                  
                  {payment.status === "pago" && payment.data_pagamento && (
                    <div className="bg-green-50 p-2 rounded border border-green-200">
                      <p className="text-xs text-green-800">
                        Pago em {new Date(payment.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-4">
                    {payment.status !== "pago" && (
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
          );
        })}
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
