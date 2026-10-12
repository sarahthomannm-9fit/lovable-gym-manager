import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const STAFF_API_URL = 'https://xtexysqtfsofdohujtfr.supabase.co/functions/v1/staff-api';

interface StaffMethod { id: string; nome: string; }
interface StaffProfessional {
  freelancer_id: string;
  nome: string;
  foto_url?: string;
  hub: string;
  especialidade: string;
  disponibilidade: string[];
  match_score?: number;
}

type Step = 'metodo' | 'profissional' | 'confirmacao';

export default function MoradorStaff() {
  const [step, setStep] = useState<Step>('metodo');
  const [alunoId, setAlunoId] = useState('');
  const [creditos, setCreditos] = useState(0);
  const [methods, setMethods] = useState<StaffMethod[]>([]);
  const [professionals, setProfessionals] = useState<StaffProfessional[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<StaffMethod | null>(null);
  const [selectedPro, setSelectedPro] = useState<StaffProfessional | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: aluno } = await (supabase as any)
        .from('alunos')
        .select('id, aulas_disponiveis')
        .eq('user_id', userData.user.id)
        .maybeSingle();
      if (aluno) { setAlunoId(aluno.id); setCreditos(aluno.aulas_disponiveis || 0); }

      try {
        const res = await fetch(`${STAFF_API_URL}/methods`);
        const json = await res.json();
        setMethods(json.methods || json || []);
      } catch {
        toast.error('Não foi possível carregar os métodos da Staff.');
      }
    })();
  }, []);

  const selectMethod = async (method: StaffMethod) => {
    setSelectedMethod(method);
    setLoading(true);
    try {
      const res = await fetch(`${STAFF_API_URL}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: method.id, limit: 10 }),
      });
      const json = await res.json();
      setProfessionals(json.professionals || json.matches || json || []);
      setStep('profissional');
    } catch {
      toast.error('Não foi possível buscar profissionais disponíveis.');
    } finally {
      setLoading(false);
    }
  };

  const selectProfessional = (pro: StaffProfessional, slot: string) => {
    setSelectedPro(pro);
    setSelectedSlot(slot);
    setStep('confirmacao');
  };

  const confirmBooking = async () => {
    if (!selectedPro || !selectedMethod || !alunoId) return;
    if (creditos < 1) { toast.error('Você não tem créditos disponíveis.'); return; }
    setBooking(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      // 1. Reserva na Staff API
      const res = await fetch(`${STAFF_API_URL}/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancer_id: selectedPro.freelancer_id,
          method: selectedMethod.id,
          slot: selectedSlot,
          hub: selectedPro.hub,
          client_id: alunoId,
          client_name: userData.user?.email || '',
        }),
      });
      if (!res.ok) throw new Error('staff_booking_failed');
      const staffBooking = await res.json();
      const staffBookingId = staffBooking.id || staffBooking.booking_id;
      if (!staffBookingId) throw new Error('staff_booking_no_id');

      // 2. Reserva local no FitPro (espelho)
      const { error: insertError } = await (supabase as any).from('staff_bookings').insert({
        aluno_id: alunoId,
        staff_booking_id: staffBookingId,
        freelancer_id: selectedPro.freelancer_id,
        method: selectedMethod.id,
        hub: selectedPro.hub,
        slot: selectedSlot,
        professional_name: selectedPro.nome,
        professional_photo_url: selectedPro.foto_url,
        credits_charged: 1,
        integration_status: 'pendente',
      });
      if (insertError) throw insertError;

      // 3. Debita o crédito localmente (devolvido pelo webhook se a Staff rejeitar)
      await (supabase as any)
        .from('alunos')
        .update({ aulas_disponiveis: creditos - 1 })
        .eq('id', alunoId);

      toast.success('Reserva enviada! Aguardando confirmação do profissional.');
      setStep('metodo');
      setSelectedMethod(null);
      setSelectedPro(null);
      setCreditos((c) => c - 1);
    } catch (err) {
      toast.error('Não foi possível concluir a reserva. Tente novamente.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm text-primary font-medium">9FIT · STAFF</p>
          <h1 className="font-display text-3xl font-normal">Agendar profissional</h1>
          <p className="text-muted-foreground">Você tem {creditos} crédito{creditos !== 1 ? 's' : ''} disponível{creditos !== 1 ? 'is' : ''}.</p>
        </div>

        {step === 'metodo' && (
          <Card className="rounded-sm shadow-elegant">
            <CardHeader><CardTitle>Escolha o método</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectMethod(m)}
                  className="rounded-sm border p-4 text-left hover:border-primary transition-colors"
                >
                  {m.nome}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {step === 'profissional' && (
          <Card className="rounded-sm shadow-elegant">
            <CardHeader><CardTitle>Profissionais disponíveis — {selectedMethod?.nome}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {loading && <p className="text-muted-foreground text-sm">Buscando profissionais...</p>}
              {!loading && professionals.length === 0 && (
                <p className="text-muted-foreground text-sm">Nenhum profissional disponível para este método no momento.</p>
              )}
              {professionals.map((pro) => (
                <div key={pro.freelancer_id} className="rounded-sm border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{pro.nome}</p>
                      <p className="text-sm text-muted-foreground">{pro.especialidade} · {pro.hub}</p>
                    </div>
                    {pro.match_score !== undefined && <Badge variant="secondary">{Math.round(pro.match_score * 100)}% match</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(pro.disponibilidade || []).map((slot) => (
                      <Button key={slot} size="sm" variant="outline" onClick={() => selectProfessional(pro, slot)}>
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              <Button variant="ghost" onClick={() => setStep('metodo')}>← Voltar</Button>
            </CardContent>
          </Card>
        )}

        {step === 'confirmacao' && selectedPro && selectedMethod && (
          <Card className="rounded-sm shadow-elegant">
            <CardHeader><CardTitle>Confirmar agendamento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-sm bg-muted p-4 space-y-1">
                <p><span className="text-muted-foreground">Método:</span> {selectedMethod.nome}</p>
                <p><span className="text-muted-foreground">Profissional:</span> {selectedPro.nome}</p>
                <p><span className="text-muted-foreground">Hub:</span> {selectedPro.hub}</p>
                <p><span className="text-muted-foreground">Horário:</span> {selectedSlot}</p>
                <p><span className="text-muted-foreground">Custo:</span> 1 crédito</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep('profissional')} disabled={booking}>← Voltar</Button>
                <Button className="flex-1" onClick={confirmBooking} disabled={booking}>
                  {booking ? 'Enviando...' : 'Confirmar reserva'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
