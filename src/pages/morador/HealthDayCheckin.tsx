import { useEffect, useRef, useState } from 'react';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  QrCode, CheckCircle2, Salad, Stethoscope, Dumbbell, Coffee,
  Sparkles, PartyPopper, CalendarClock, Gift, Users,
} from 'lucide-react';

const ACCENT = '#F472B6';

type CheckinStatus = 'idle' | 'loading' | 'confirmado' | 'lista_espera' | 'sem_vaga' | 'ja_inscrito' | 'evento_inativo' | 'erro';

const ESTACOES = [
  { icon: Salad, title: 'Nutrição', desc: 'Rastreio de hábitos nocivos e orientação alimentar personalizada.' },
  { icon: Stethoscope, title: 'Fisioterapia', desc: 'Análise postural e identificação de desalinhamentos.' },
  { icon: Dumbbell, title: 'Personal', desc: 'Avaliação da sua capacidade física funcional no dia a dia.' },
  { icon: Coffee, title: 'Coffee & Tech', desc: 'Conheça o app, aulas coletivas, plantão semanal e benefícios exclusivos.' },
];

/**
 * Rota: /morador/health-day/:eventoId/confirmar
 * Chamada tanto ao escanear o QR (câmera) quanto ao acessar o link direto (cartaz impresso).
 */
export default function HealthDayCheckin() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CheckinStatus>('idle');
  const [evento, setEvento] = useState<any>(null);

  const confirmarPresenca = async () => {
    if (!eventoId) return;
    setStatus('loading');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error('Faça login para confirmar presença');
        navigate('/login');
        return;
      }

      const { data, error } = await supabase.functions.invoke('health-day-checkin', {
        body: { evento_id: eventoId },
      });

      if (error) throw error;

      setEvento(data?.evento || null);
      const resultado: CheckinStatus = data?.ja_inscrito
        ? (data.status === 'confirmado' ? 'ja_inscrito' : data.status)
        : data?.status;
      setStatus(resultado || 'erro');

      if (resultado === 'confirmado') toast.success('Presença confirmada no Health Day! 🎉');
      if (resultado === 'ja_inscrito') toast('Você já está confirmado neste Health Day');
    } catch (e) {
      console.error(e);
      setStatus('erro');
      toast.error('Não foi possível confirmar. Tente novamente.');
    }
  };

  useEffect(() => { confirmarPresenca(); }, [eventoId]);

  return (
    <PersonaLayout title="Health Day" subtitle="Assessoria esportiva digital do condomínio" accent={ACCENT}>
      <div className="max-w-xl mx-auto space-y-6">
        {status === 'idle' || status === 'loading' ? (
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-8 text-center space-y-3">
              <QrCode className="w-10 h-10 mx-auto text-muted-foreground/50 animate-pulse" />
              <p className="text-muted-foreground">Confirmando sua presença…</p>
            </CardContent>
          </Card>
        ) : status === 'confirmado' || status === 'ja_inscrito' ? (
          <Card className="bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
              <h1 className="text-2xl font-semibold">
                {status === 'ja_inscrito' ? 'Você já está confirmado!' : 'Presença confirmada!'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Te esperamos no próximo Health Day. Traga sua garrafinha de água 💧
              </p>
              <Button size="lg" className="mt-2" style={{ backgroundColor: ACCENT, color: '#000' }} asChild>
                <a href="/morador">Ir para meu painel</a>
              </Button>
            </CardContent>
          </Card>
        ) : status === 'lista_espera' ? (
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="p-8 text-center space-y-3">
              <Users className="w-12 h-12 mx-auto text-amber-400" />
              <h1 className="text-2xl font-semibold">Você está na lista de espera</h1>
              <p className="text-sm text-muted-foreground">
                Avisaremos se surgir uma vaga. Fique de olho nas notificações!
              </p>
            </CardContent>
          </Card>
        ) : status === 'sem_vaga' ? (
          <HealthDayNewsletter evento={evento} />
        ) : status === 'evento_inativo' ? (
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-8 text-center space-y-2">
              <p className="font-medium">Este Health Day não está mais ativo</p>
              <p className="text-sm text-muted-foreground">Fique atento ao próximo evento no seu condomínio.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-8 text-center space-y-3">
              <p className="font-medium">Não foi possível confirmar sua presença</p>
              <Button variant="outline" onClick={confirmarPresenca}>Tentar novamente</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PersonaLayout>
  );
}

/** Feed estilo newsletter exibido quando as vagas do Health Day esgotaram. */
function HealthDayNewsletter({ evento }: { evento: any }) {
  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
        <CardContent className="p-6 text-center space-y-2">
          <PartyPopper className="w-10 h-10 mx-auto text-primary" />
          <h1 className="text-2xl font-semibold">As vagas deste Health Day esgotaram!</h1>
          <p className="text-sm text-muted-foreground">
            O interesse foi tão grande que já não há mais lugar 💪 Enquanto isso, aproveite o que a 9FIT preparou para você.
          </p>
          {evento?.data_evento && (
            <Badge variant="outline" className="mt-1">
              <CalendarClock className="w-3 h-3 mr-1" />
              Próximo Health Day: {new Date(evento.data_evento).toLocaleDateString('pt-BR')}
            </Badge>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">O que rola no Health Day</h2>
        <div className="space-y-3">
          {ESTACOES.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="bg-card/60 border-border/40">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-card/40 border-border/30">
        <CardContent className="p-5 flex items-start gap-3">
          <Gift className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm mb-1">Benefícios e descontos</p>
            <p className="text-sm text-muted-foreground">
              Aulas coletivas, plantão semanal com o Rony e horário especial de professor em sala —
              tudo incluído na assessoria do seu condomínio. Confira também descontos em outros produtos e serviços parceiros.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/30">
        <CardContent className="p-5 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">
            Quer garantir vaga no próximo Health Day? Fique de olho nos comunicados do condomínio — avisamos assim que abrirem novas inscrições.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
