import { useEffect, useState } from 'react';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Activity, MessageSquarePlus, LifeBuoy } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

export default function SindicoHome() {
  const { activeOrg } = useOperationalContext();
  const [stats, setStats] = useState({ alunos: 0, aulasSemana: 0, presencasSemana: 0 });
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!activeOrg) return;
    (async () => {
      const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const [{ count: alunos }, { data: aulas }, { count: presencas }] = await Promise.all([
        supabase.from('alunos').select('id', { count: 'exact', head: true })
          .eq('organization_id', activeOrg.id).eq('status', 'ativo'),
        supabase.from('aulas').select('id, data_aula, nome, horario_inicio')
          .gte('data_aula', sevenAgo).limit(50),
        supabase.from('checkins').select('id', { count: 'exact', head: true })
          .gte('data_checkin', sevenAgo),
      ]);
      setStats({
        alunos: alunos || 0,
        aulasSemana: (aulas || []).length,
        presencasSemana: presencas || 0,
      });
    })();
  }, [activeOrg]);

  const enviarSolicitacao = async () => {
    if (!mensagem.trim()) return toast.error('Escreva uma mensagem');
    setEnviando(true);
    const { error } = await supabase.from('support_tickets').insert({
      message: `[${activeOrg?.nome}] ${mensagem}`,
      category: 'condominio',
    });
    setEnviando(false);
    if (error) toast.error('Falha ao enviar');
    else { toast.success('Solicitação enviada para a equipe 9FIT'); setMensagem(''); }
  };

  return (
    <PersonaLayout title="Painel do Síndico" accent="#60A5FA">
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <KPI icon={Users} label="Alunos ativos" value={stats.alunos} accent="#60A5FA" />
        <KPI icon={Calendar} label="Aulas (7 dias)" value={stats.aulasSemana} accent="#60A5FA" />
        <KPI icon={Activity} label="Presenças (7 dias)" value={stats.presencasSemana} accent="#60A5FA" />
      </div>

      <Card className="bg-card/60 border-border/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <LifeBuoy className="w-4 h-4 text-[#60A5FA]" />
            <h2 className="font-semibold">Falar com a equipe 9FIT</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Qualquer ação operacional (cobrança, troca de professor, evento) — descreva e nós cuidamos.
          </p>
          <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Ex.: Aula de pilates de terça precisa mudar de horário…"
                    className="mb-3" rows={4} />
          <Button onClick={enviarSolicitacao} disabled={enviando}
                  className="bg-[#60A5FA] text-black hover:bg-[#60A5FA]/90">
            <MessageSquarePlus className="w-4 h-4 mr-1" />
            {enviando ? 'Enviando…' : 'Enviar solicitação'}
          </Button>
        </CardContent>
      </Card>
    </PersonaLayout>
  );
}

function KPI({ icon: Icon, label, value, accent }: any) {
  return (
    <Card className="bg-card/60 border-border/40">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
             style={{ backgroundColor: `${accent}1A`, color: accent }}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
