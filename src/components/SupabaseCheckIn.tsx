import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, QrCode, List, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseGymData } from "@/contexts/SupabaseGymDataContext";
import { QRCodeCheckIn } from "./checkin/QRCodeCheckIn";
import { PageShell } from "./warroom/PageShell";
import { cn } from "@/lib/utils";

type ScanState = 'idle' | 'success' | 'error_inadimplente' | 'error_cancelado' | 'error_not_found';

export function SupabaseCheckIn() {
  const { students, checkIns, payments, addCheckIn, updateCheckIn } = useSupabaseGymData();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("qrcode");
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanName, setScanName] = useState('');

  const resetScan = () => { setTimeout(() => { setScanState('idle'); setScanName(''); }, 2000); };

  const handleCheckIn = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) {
      setScanState('error_not_found'); setScanName(''); resetScan();
      toast({ title: "Erro", description: "Aluno não encontrado", variant: "destructive" });
      return;
    }
    if (student.status === 'cancelado') {
      setScanState('error_cancelado'); setScanName(student.nome); resetScan();
      toast({ title: "Matrícula cancelada", description: `${student.nome} - matrícula cancelada`, variant: "destructive" });
      return;
    }
    // Check inadimplência
    const hojeStr = new Date().toISOString().split('T')[0];
    const temAtraso = (payments || []).some((p: any) => p.aluno_id === studentId && p.status !== 'pago' && p.data_vencimento < hojeStr);
    if (temAtraso) {
      setScanState('error_inadimplente'); setScanName(student.nome); resetScan();
      toast({ title: "Pagamento pendente", description: `${student.nome} tem pagamento em atraso`, variant: "destructive" });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const activeCheckIn = checkIns.find(
      record => record.aluno_id === studentId && 
      (record.data_checkin === today || record.horario_entrada?.startsWith(today)) && !record.horario_saida
    );
    if (activeCheckIn) {
      toast({ title: "Já na academia", description: `${student.nome} já fez check-in`, variant: "destructive" });
      return;
    }

    try {
      await addCheckIn({ aluno_id: studentId, data_checkin: today, horario_entrada: new Date().toISOString() });
      setScanState('success'); setScanName(student.nome); resetScan();
      setSearchQuery("");
      toast({ title: "Check-in realizado", description: `${student.nome} entrou na academia` });
    } catch (error) { console.error('Failed to add check-in:', error); }
  };

  const handleCheckOut = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const today = new Date().toISOString().split('T')[0];
    const activeCheckIn = checkIns.find(
      record => record.aluno_id === studentId && 
      (record.data_checkin === today || record.horario_entrada?.startsWith(today)) && !record.horario_saida
    );
    if (!activeCheckIn) { toast({ title: "Erro", description: "Check-in ativo não encontrado", variant: "destructive" }); return; }
    try {
      await updateCheckIn(activeCheckIn.id, { horario_saida: new Date().toISOString() });
      toast({ title: "Check-out realizado", description: `${student.nome} saiu da academia` });
    } catch (error) { console.error('Failed to update check-in:', error); }
  };

  const filteredStudents = students.filter(student =>
    student.nome.toLowerCase().includes(searchQuery.toLowerCase()) || student.id.toString().includes(searchQuery)
  );

  const today = new Date().toISOString().split('T')[0];
  const activeStudents = students.filter(student => 
    checkIns.some(record => record.aluno_id === student.id && 
      (record.data_checkin === today || record.horario_entrada?.startsWith(today)) && !record.horario_saida)
  );
  const todayCheckIns = checkIns.filter(record => 
    record.data_checkin === today || (record.horario_entrada && record.horario_entrada.startsWith(today))
  ).length;

  const shellMetrics = [
    { label: 'NA ACADEMIA', value: String(activeStudents.length), color: 'text-[hsl(var(--urgency-opportunity))]' },
    { label: 'HOJE', value: String(todayCheckIns) },
    { label: 'TOTAL HISTÓRICO', value: String(checkIns.length) },
    { label: 'ALUNOS', value: String(students.length) },
  ];

  // Scan state overlay
  const scanOverlay = scanState !== 'idle' && (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center transition-all duration-300',
      scanState === 'success' && 'bg-[hsl(var(--urgency-opportunity))]/20',
      scanState === 'error_inadimplente' && 'bg-[hsl(var(--urgency-attention))]/20',
      scanState === 'error_cancelado' && 'bg-[hsl(var(--urgency-critical))]/20',
      scanState === 'error_not_found' && 'bg-[hsl(var(--urgency-critical))]/20',
    )}>
      <Card className={cn(
        'w-96 shadow-2xl border-2',
        scanState === 'success' && 'border-[hsl(var(--urgency-opportunity))]',
        scanState === 'error_inadimplente' && 'border-[hsl(var(--urgency-attention))]',
        (scanState === 'error_cancelado' || scanState === 'error_not_found') && 'border-[hsl(var(--urgency-critical))]',
      )}>
        <CardContent className="p-8 text-center space-y-3">
          {scanState === 'success' && <><CheckCircle2 className="h-16 w-16 mx-auto text-[hsl(var(--urgency-opportunity))]" /><p className="text-xl font-bold">Check-in realizado</p><p className="text-lg">{scanName}</p></>}
          {scanState === 'error_inadimplente' && <><AlertTriangle className="h-16 w-16 mx-auto text-[hsl(var(--urgency-attention))]" /><p className="text-xl font-bold">Pagamento Pendente</p><p className="text-lg">{scanName}</p><Button variant="outline" size="sm" className="mt-2" onClick={() => setScanState('idle')}>Liberar manualmente</Button></>}
          {scanState === 'error_cancelado' && <><XCircle className="h-16 w-16 mx-auto text-[hsl(var(--urgency-critical))]" /><p className="text-xl font-bold">Matrícula Cancelada</p><p className="text-lg">{scanName}</p></>}
          {scanState === 'error_not_found' && <><XCircle className="h-16 w-16 mx-auto text-[hsl(var(--urgency-critical))]" /><p className="text-xl font-bold">Aluno não encontrado</p></>}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <PageShell title="CHECK-IN / CHECK-OUT" sub="Controle de acesso" metrics={shellMetrics}>
      {scanOverlay}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="qrcode" className="flex items-center gap-2"><QrCode className="w-4 h-4" />QR Code</TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2"><List className="w-4 h-4" />Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="qrcode" className="mt-6"><QRCodeCheckIn /></TabsContent>

        <TabsContent value="manual" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center text-sm"><Search className="w-4 h-4 mr-2" />Fazer Check-in</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Buscar por nome..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                {searchQuery && (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div><div className="font-medium text-sm">{student.nome}</div><div className="text-xs text-muted-foreground">{student.email}</div></div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={student.status === "ativo" ? "default" : "destructive"} className="text-[10px]">{student.status}</Badge>
                          <Button size="sm" onClick={() => handleCheckIn(student.id)} disabled={student.status !== "ativo"}>Check-in</Button>
                        </div>
                      </div>
                    )) : <p className="text-muted-foreground text-center py-4 text-sm">Nenhum aluno encontrado</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center text-sm"><Users className="w-4 h-4 mr-2" />Na Academia ({activeStudents.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {activeStudents.map((student) => {
                    const lastEntry = checkIns.filter(c => c.aluno_id === student.id && c.horario_entrada && !c.horario_saida).sort((a, b) => new Date(b.horario_entrada!).getTime() - new Date(a.horario_entrada!).getTime())[0];
                    const entryTime = lastEntry?.horario_entrada ? new Date(lastEntry.horario_entrada) : new Date();
                    const minutesInGym = Math.floor((Date.now() - entryTime.getTime()) / 60000);
                    return (
                      <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{student.nome}</div>
                          <div className="text-xs text-muted-foreground font-mono">{entryTime.toTimeString().split(' ')[0]} · {minutesInGym}min</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleCheckOut(student.id)}>Check-out</Button>
                      </div>
                    );
                  })}
                  {activeStudents.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">Nenhum aluno na academia</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
