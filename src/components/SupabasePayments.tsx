import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Zap, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { ConfirmDialog } from "./ConfirmDialog";
import { PageShell } from "./warroom/PageShell";
import { cn } from "@/lib/utils";

function getEtapaRegua(dueDate: string): { etapa: string; num: number; color: string } {
  const diff = Math.ceil((Date.now() - new Date(dueDate).getTime()) / 86400000);
  if (diff <= 0) return { etapa: 'Em dia', num: 0, color: 'text-[hsl(var(--urgency-opportunity))]' };
  if (diff <= 3) return { etapa: 'D+1-3', num: 1, color: 'text-[hsl(var(--urgency-attention))]' };
  if (diff <= 7) return { etapa: 'D+3-7', num: 2, color: 'text-[hsl(var(--urgency-attention))]' };
  if (diff <= 15) return { etapa: 'D+7-15', num: 3, color: 'text-[hsl(var(--urgency-critical))]' };
  if (diff <= 30) return { etapa: 'D+15-30', num: 4, color: 'text-[hsl(var(--urgency-critical))]' };
  return { etapa: 'D+30+', num: 5, color: 'text-destructive' };
}

export function SupabasePayments() {
  const { payments, students, addPayment, updatePayment } = useSupabaseGymData();
  const { toast } = useToast();
  const [newPayment, setNewPayment] = useState({ studentId: "", amount: "", dueDate: "", method: "" });
  const [batchLoading, setBatchLoading] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

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
    setNewPayment(prev => ({ ...prev, amount: student.valor_mensalidade ? String(student.valor_mensalidade) : prev.amount, dueDate: dueDate || prev.dueDate, method: student.forma_pagamento || prev.method }));
  }, [newPayment.studentId, students]);

  const handleAddPayment = async () => {
    if (!newPayment.studentId || !newPayment.amount || !newPayment.dueDate || !newPayment.method) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" }); return;
    }
    try {
      const currentDate = new Date();
      await addPayment({ aluno_id: newPayment.studentId, valor: parseFloat(newPayment.amount), data_vencimento: newPayment.dueDate, metodo_pagamento: newPayment.method, status: 'pendente', referencia_mes: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01` });
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
      toast({ title: "Cobranças geradas!", description: `${toCreate.length} cobranças criadas.` });
    } catch (error) { toast({ title: "Erro", description: "Falha ao gerar cobranças", variant: "destructive" }); } finally { setBatchLoading(false); }
  };

  const confirmMarkAsPaid = async () => {
    if (!markingPaidId) return;
    try {
      await updatePayment(markingPaidId, { status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] });
      toast({ title: "Pagamento confirmado" });
    } catch (error) { console.error('Failed to update payment:', error); }
    setMarkingPaidId(null);
  };

  const hojeStr = new Date().toISOString().split('T')[0];
  const totalPendente = payments.filter(p => p.status === "pendente").reduce((sum, p) => sum + Number(p.valor), 0);
  const totalRecebido = payments.filter(p => p.status === "pago").reduce((sum, p) => sum + Number(p.valor), 0);
  const overduePayments = payments.filter(p => p.status !== "pago" && p.data_vencimento && p.data_vencimento < hojeStr);
  const totalVencido = overduePayments.reduce((sum, p) => sum + Number(p.valor), 0);

  const filteredPayments = filterStatus === 'all' ? payments :
    filterStatus === 'vencido' ? overduePayments :
    payments.filter(p => p.status === filterStatus);

  const shellMetrics = [
    { label: 'RECEBIDO', value: `R$ ${totalRecebido.toLocaleString('pt-BR')}`, color: 'text-[hsl(var(--urgency-opportunity))]' },
    { label: 'PENDENTE', value: `R$ ${totalPendente.toLocaleString('pt-BR')}`, color: 'text-[hsl(var(--urgency-attention))]' },
    { label: 'VENCIDO', value: `R$ ${totalVencido.toLocaleString('pt-BR')}`, sub: `${overduePayments.length} cobranças`, color: totalVencido > 0 ? 'text-[hsl(var(--urgency-critical))]' : undefined },
    { label: 'TOTAL', value: String(payments.length) },
  ];

  return (
    <PageShell 
      title="PAGAMENTOS" 
      sub="Cobranças e recebimentos"
      criticals={overduePayments.length > 0 ? overduePayments.length : undefined}
      metrics={shellMetrics}
      actions={
        <div className="flex gap-2">
          <button onClick={handleBatchGenerate} disabled={batchLoading} className="px-3 py-1.5 text-[10px] font-mono font-semibold tracking-wider rounded bg-transparent text-white/55 border border-white/20 cursor-pointer hover:text-white hover:border-white/40 transition-colors disabled:opacity-50">
            {batchLoading ? 'GERANDO...' : 'GERAR MÊS'}
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: 'all', label: 'Todos' },
          { value: 'pendente', label: 'Pendentes' },
          { value: 'vencido', label: 'Vencidos' },
          { value: 'pago', label: 'Pagos' },
        ].map(f => (
          <Button key={f.value} variant={filterStatus === f.value ? 'default' : 'outline'} size="sm" className="text-xs h-7" onClick={() => setFilterStatus(f.value)}>
            {f.label}
          </Button>
        ))}

        <Dialog>
          <DialogTrigger asChild><Button size="sm" className="text-xs h-7 ml-auto"><Plus className="w-3 h-3 mr-1" />Nova Cobrança</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Criar Nova Cobrança</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Aluno</Label><Select value={newPayment.studentId} onValueChange={(v) => setNewPayment(p => ({...p, studentId: v}))}><SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}{s.valor_mensalidade ? ` (R$ ${s.valor_mensalidade})` : ''}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={newPayment.amount} onChange={(e) => setNewPayment(p => ({...p, amount: e.target.value}))} /></div>
              <div><Label>Vencimento</Label><Input type="date" value={newPayment.dueDate} onChange={(e) => setNewPayment(p => ({...p, dueDate: e.target.value}))} /></div>
              <div><Label>Método</Label><Select value={newPayment.method} onValueChange={(v) => setNewPayment(p => ({...p, method: v}))}><SelectTrigger><SelectValue placeholder="Método" /></SelectTrigger><SelectContent><SelectItem value="pix">PIX</SelectItem><SelectItem value="cartao">Cartão</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem><SelectItem value="boleto">Boleto</SelectItem><SelectItem value="credito_recorrente">Recorrente</SelectItem></SelectContent></Select></div>
              <Button onClick={handleAddPayment} className="w-full">Criar Cobrança</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredPayments.map((payment) => {
          const student = students.find(s => s.id === payment.aluno_id);
          const isOverdue = payment.status !== 'pago' && payment.data_vencimento && payment.data_vencimento < hojeStr;
          const etapa = payment.data_vencimento ? getEtapaRegua(payment.data_vencimento) : null;
          
          return (
            <Card key={payment.id} className={cn('transition-all', isOverdue && 'border-l-4 border-l-[hsl(var(--urgency-critical))]')}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{student?.nome || 'Não encontrado'}</span>
                  <div className="flex gap-1">
                    {etapa && payment.status !== 'pago' && (
                      <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5 font-mono', etapa.color)}>{etapa.etapa}</Badge>
                    )}
                    <Badge className={cn('text-[9px] h-4 px-1.5',
                      payment.status === 'pago' ? 'bg-[hsl(var(--urgency-opportunity))] text-black' :
                      isOverdue ? 'bg-[hsl(var(--urgency-critical))] text-white' :
                      'bg-[hsl(var(--urgency-attention))] text-black'
                    )}>
                      {payment.status === 'pago' ? 'Pago' : isOverdue ? 'Vencido' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold font-mono">R$ {Number(payment.valor).toLocaleString('pt-BR')}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {payment.data_vencimento && new Date(payment.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground capitalize">{payment.metodo_pagamento || 'Não informado'}</div>
                {payment.status !== "pago" && (
                  <Button size="sm" variant="outline" className="w-full text-xs h-7 mt-1" onClick={() => setMarkingPaidId(payment.id)}>
                    Marcar Pago
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {payments.length === 0 && (
        <Card className="mt-4"><CardContent className="py-12 text-center">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum pagamento cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">Crie cobranças individuais ou gere em lote</p>
        </CardContent></Card>
      )}

      <ConfirmDialog open={!!markingPaidId} onOpenChange={(open) => !open && setMarkingPaidId(null)} title="Confirmar Pagamento" description="Marcar este pagamento como pago? Data de hoje será registrada." onConfirm={confirmMarkAsPaid} confirmLabel="Confirmar" />
    </PageShell>
  );
}
