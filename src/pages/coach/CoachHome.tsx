import { useEffect, useState } from 'react';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, CheckCircle2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function CoachHome() {
  const { activeOrg } = useOperationalContext();
  const [aulasHoje, setAulasHoje] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [marcando, setMarcando] = useState<string | null>(null);

  const carregar = async () => {
    if (!activeOrg) return;
    const hoje = new Date().toISOString().slice(0, 10);
    const { data: a } = await supabase.from('aulas')
      .select('id, nome, horario_inicio, horario_fim, inscritos_atual')
      .eq('data_aula', hoje).order('horario_inicio');
    setAulasHoje(a || []);
    const { data: al } = await supabase.from('alunos')
      .select('id, nome, status')
      .eq('organization_id', activeOrg.id).eq('status', 'ativo').limit(20);
    setAlunos(al || []);
  };

  useEffect(() => { carregar(); }, [activeOrg]);

  const marcarPresenca = async (alunoId: string, nome: string) => {
    setMarcando(alunoId);
    const { error } = await supabase.from('checkins').insert({
      aluno_id: alunoId,
      data_checkin: new Date().toISOString().slice(0, 10),
    });
    setMarcando(null);
    if (error) toast.error('Falha ao registrar presença');
    else toast.success(`Presença de ${nome} registrada`);
  };

  return (
    <PersonaLayout title="Meu dia" accent="#C8FF00">
      <section className="mb-6">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Aulas de hoje
        </h2>
        {aulasHoje.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem aulas agendadas para hoje.</p>
        ) : (
          <div className="space-y-2">
            {aulasHoje.map((a) => (
              <Card key={a.id} className="bg-card/60 border-border/40">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{a.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.horario_inicio?.slice(0, 5)} – {a.horario_fim?.slice(0, 5)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[#C8FF00]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">{a.inscritos_atual ?? 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Meus alunos
        </h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {alunos.map((al) => (
            <Card key={al.id} className="bg-card/60 border-border/40">
              <CardContent className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm truncate">{al.nome}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{al.status}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={marcando === al.id}
                  onClick={() => marcarPresenca(al.id, al.nome)}
                  className="shrink-0 border-[#C8FF00]/40 text-[#C8FF00] hover:bg-[#C8FF00]/10"
                >
                  <UserCheck className="w-3 h-3 mr-1" />
                  {marcando === al.id ? '…' : 'Presença'}
                </Button>
              </CardContent>
            </Card>
          ))}
          {alunos.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">Nenhum aluno vinculado ainda.</p>
          )}
        </div>
      </section>
    </PersonaLayout>
  );
}
