
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CreditCard, Plus, DollarSign, AlertCircle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { ConfirmDialog } from "./ConfirmDialog";

export function SupabasePayments() {
  const { payments, students, addPayment, updatePayment } = useSupabaseGymData();
  const { toast } = useToast();

  const [newPayment, setNewPayment] = useState({ studentId: "", amount: "", dueDate: "", method: "" });
  const [batchLoading, setBatchLoading] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  useEffect(() => {
    if (!newPayment.studentId) return;
    const student = students.find(s => s.id === newPayment.studentId);
    if (!student) return;
    const today = new Date();
    let dueDate = '';
    if (student.dia_pagamento) {
      const dd = Math.min(student.dia_pagamento, 28);
      const due = new Date(today.getFullYear(), today.getMonth(), dd);
      if (due < today) due.setMonth(due.getMonth() + 1);
      dueDate = due.toISOString().split('T')[0];
    }
    setNewPayment(prev => ({
      ...prev,
      amount: student.valor_mensalidade ? String(student.valor_mensalidade) : prev.amount,
      dueDate: dueDate || prev.dueDate,
      method: student.forma_pagamento || prev.method,
    }));
  }, [newPayment.studentId, students]);

  const handleAddPayment = async () => {
    if (!newPayment.studentId || !newPayment.amount || !newPayment.dueDate || !newPayment.method) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    try {
      const currentDate = new Date();
      await addPayment({
        aluno_id: newPayment.studentId,
        valor: parseFloat(newPayment.amount),
        data_vencimento: newPayment.dueDate,
        metodo_pagamento: newPayment.method,
        status: 'pendente',
        referencia_mes: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`
      });
      setNewPayment({ studentId: "", amount: "", dueDate: "", method: "" });
      toast({ title: "Sucesso", description: "Cobrança criada com sucesso!" });
    } catch (error) { console.error('Failed to add payment:', error); }
  };

  const handleBatchGenerate = async () => {
    setBatchLoading(true);
    try {
      const today = new Date();
      const refMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      const activeStudents = students.filter(s => s.status === 'ativo' && s.valor_mensalidade && s.valor_mensalidade > 0);
      const existingStudentIds = new Set(payments.filter(p => p.referencia_mes === refMonth).map(p => p.aluno_id));
      const toCreate = activeStudents.filter(s => !existingStudentIds.has(s.id));
      if (toCreate.length === 0) { toast({ title: "Info", description: "Todas as cobranças do mês já foram geradas." }); setBatchLoading(false); return; }
      for (const student of toCreate) {
        const dd = Math.min(student.dia_pagamento || today.getDate(), 28);
        const dueDate = new Date(today.getFullYear(), today.getMonth(), dd);
        if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1);
        await addPayment({ aluno_id: student.id, valor: student.valor_mensalidade!, data_vencimento: dueDate.toISOString().split('T')[0], metodo_pagamento: student.forma_pagamento || 'pix', status: 'pendente', referencia_mes: refMonth });
      }
      toast({ title: "🎉 Cobranças geradas!", description: `${toCreate.length} cobranças criadas para o mês.` });
    } catch (error) { console.error('Batch generation error:', error); toast({ title: "Erro", description: "Falha ao gerar cobranças em lote", variant: "destructive" }); } finally { setBatchLoading(false); }
  };

  const confirmMarkAsPaid = async () => {
    if (!markingPaidId) return;
    try {
      await updatePayment(markingPaidId, { status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] });
      toast({ title: "Pagamento confirmado", description: "Pagamento foi confirmado com sucesso" });
    } catch (error) { console.error('Failed to update payment:', error); }
    setMarkingPaidId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) { case "pago": return "bg-green-100 text-green-800"; case "pendente": return "bg-yellow-100 text-yellow-800"; case "cancelado": case "atrasado": return "bg-red-100 text-red-800"; default: return "bg-gray-100 text-gray-800"; }
  };
  const getStatusLabel = (status: string) => {
    switch (status) { case "pago": return "Pago"; case "pendente": return "Pendente"; case "cancelado": return "Cancelado"; case "atrasado": return "Atrasado"; default: return status; }
  };
  const getDaysOverdue = (dueDate: string) => Math.ceil((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));

  const totalPendente = payments.filter(p => p.status === "pendente").reduce((sum, p) => sum + Number(p.valor), 0);
  const totalRecebido = payments.filter(p => p.status === "pago").reduce((sum, p) => sum + Number(p.valor), 0);
  const overduePayments = payments.filter(p => p.status !== "pago" && p.data_vencimento && getDaysOverdue(p.data_vencimento) > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Pagamentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie cobranças e recebimentos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBatchGenerate} disabled={batchLoading}><Zap className="w-4 h-4 mr-2" />{batchLoading ? 'Gerando...' : 'Gerar Cobranças do Mês'}</Button>
          <Dialog>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Cobrança</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Criar Nova Cobrança</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Aluno</Label><Select value={newPayment.studentId} onValueChange={(v) => setNewPayment(p => ({...p, studentId: v}))}><SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}{s.valor_mensalidade ? ` (R$ ${s.valor_mensalidade})` : ''}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={newPayment.amount} onChange={(e) => setNewPayment(p => ({...p, amount: e.target.value}))} placeholder="0,00" /></div>
                <div><Label>Data de Vencimento</Label><Input type="date" value={newPayment.dueDate} onChange={(e) => setNewPayment(p => ({...p, dueDate: e.target.value}))} /></div>
                <div><Label>Método de Pagamento</Label><Select value={newPayment.method} onValueChange={(v) => setNewPayment(p => ({...p, method: v}))}><SelectTrigger><SelectValue placeholder="Selecione o método" /></SelectTrigger><SelectContent><SelectItem value="pix">PIX</SelectItem><SelectItem value="cartao">Cartão de Crédito</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem><SelectItem value="transferencia">Transferência</SelectItem><SelectItem value="boleto">Boleto</SelectItem><SelectItem value="credito_recorrente">Crédito Recorrente</SelectItem></SelectContent></Select></div>
                <Button onClick={handleAddPayment} className="w-full">Criar Cobrança</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><DollarSign className="w-4 h-4 mr-2 text-green-600" />Total Recebido</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">R$ {totalRecebido.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><CreditCard className="w-4 h-4 mr-2 text-yellow-600" />Pendente</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">R$ {totalPendente.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-red-600" />Em Atraso</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{overduePayments.length}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {payments.map((payment) => {
          const student = students.find(s => s.id === payment.aluno_id);
          return (
            <Card key={payment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-lg font-semibold">{student?.nome || 'Aluno não encontrado'}</CardTitle><Badge className={getStatusColor(payment.status || 'pendente')}>{getStatusLabel(payment.status || 'pendente')}</Badge></div></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Valor:</span><span className="font-semibold text-lg">R$ {Number(payment.valor).toLocaleString()}</span></div>
                  {payment.data_vencimento && <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Vencimento:</span><span className="text-sm">{new Date(payment.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</span></div>}
                  <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Método:</span><span className="text-sm capitalize">{payment.metodo_pagamento || 'Não informado'}</span></div>
                  {payment.status === "pendente" && payment.data_vencimento && getDaysOverdue(payment.data_vencimento) > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded border border-red-200"><p className="text-xs text-red-800 dark:text-red-300">Atrasado há {getDaysOverdue(payment.data_vencimento)} dias</p></div>
                  )}
                  {payment.status === "pago" && payment.data_pagamento && (
                    <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded border border-green-200"><p className="text-xs text-green-800 dark:text-green-300">Pago em {new Date(payment.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR')}</p></div>
                  )}
                  <div className="flex space-x-2 mt-4">
                    {payment.status !== "pago" && (
                      <Button size="sm" variant="outline" onClick={() => setMarkingPaidId(payment.id)}>Marcar Pago</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {payments.length === 0 && (
        <div className="text-center py-12"><p className="text-muted-foreground">Nenhum pagamento cadastrado</p><p className="text-sm text-muted-foreground mt-1">Crie sua primeira cobrança ou gere cobranças em lote</p></div>
      )}

      <ConfirmDialog
        open={!!markingPaidId}
        onOpenChange={(open) => !open && setMarkingPaidId(null)}
        title="Confirmar Pagamento"
        description="Tem certeza que deseja marcar este pagamento como pago? A data de pagamento será registrada como hoje."
        onConfirm={confirmMarkAsPaid}
        confirmLabel="Confirmar Pagamento"
      />
    </div>
  );
}
