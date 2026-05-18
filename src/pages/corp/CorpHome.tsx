import { useEffect, useState } from 'react';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingUp, Activity } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CorpHome() {
  const { activeOrg } = useOperationalContext();
  const [alunos, setAlunos] = useState<any[]>([]);

  useEffect(() => {
    if (!activeOrg) return;
    (async () => {
      const { data } = await supabase.from('alunos')
        .select('id, nome, status, data_matricula')
        .eq('organization_id', activeOrg.id).order('nome');
      setAlunos(data || []);
    })();
  }, [activeOrg]);

  const ativos = alunos.filter((a) => a.status === 'ativo').length;
  const adesao = alunos.length ? Math.round((ativos / alunos.length) * 100) : 0;

  return (
    <PersonaLayout title="Painel Corporativo" subtitle="Relatório executivo" accent="#A78BFA">
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <KPI icon={Users} label="Funcionários elegíveis" value={alunos.length} accent="#A78BFA" />
        <KPI icon={Activity} label="Ativos" value={ativos} accent="#A78BFA" />
        <KPI icon={TrendingUp} label="Adesão" value={`${adesao}%`} accent="#A78BFA" />
      </div>

      <Card className="bg-card/60 border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alunos.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.nome}</TableCell>
                  <TableCell><span className="text-xs uppercase">{a.status}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.data_matricula}</TableCell>
                </TableRow>
              ))}
              {alunos.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                  Nenhum funcionário vinculado ainda.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
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
