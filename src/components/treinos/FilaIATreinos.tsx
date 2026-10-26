import { useSupabaseStudents } from '@/hooks/useSupabaseStudents';
import { CriarTreinoDialog } from '@/components/CriarTreinoDialog';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, CheckCircle2, Eye, XCircle, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { useAuth } from '@/contexts/AuthContext';

type FilaItem = {
  id: string;
  aluno_id: string;
  organization_id: string | null;
  objetivo: string | null;
  nivel: string | null;
  resumo: string | null;
  sugestao: any;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  created_at: string;
  alunos?: { nome: string } | null;
};

export function FilaIATreinos() {
  const { activeOrg } = useOperationalContext();
  const {students:roster}=useSupabaseStudents();
  const { user } = useAuth();
  const [items, setItems] = useState<FilaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<FilaItem | null>(null);

  const carregar = async () => {
    if (!activeOrg) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const query = supabase
      .from('treinos_ia_fila')
      .select('*, alunos(nome)')
      .eq('status', 'pendente')
      .eq('organization_id', activeOrg.id)
      .order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) toast.error('Falha ao carregar fila');
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [activeOrg?.id]);

  const rejeitar = async (id: string) => {
    const { error } = await supabase.from('treinos_ia_fila').update({ status: 'rejeitado' }).eq('id', id);
    if (error) return toast.error('Não foi possível descartar a sugestão.');
    toast.info('Sugestão descartada');
    carregar();
  };

  if (loading) return <div className="py-12 text-center text-sm text-muted-foreground">Carregando fila IA…</div>;

  if (!items.length) {
    return (
      <Card className="border-dashed border-primary/20 bg-card/40">
        <CardContent className="py-12 text-center space-y-3">
          <Bot className="w-10 h-10 mx-auto text-primary/60" />
          <p className="font-semibold">Nenhum treino aguardando aprovação</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Quando um aluno preencher a anamnese, a IA gera automaticamente uma sugestão de plano aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map(item => {
          const dias = Array.isArray(item.sugestao?.exercicios)
            ? [...new Set(item.sugestao.exercicios.map((e: any) => e.dia_semana ?? 1))].length
            : (item.sugestao?.dias_semana || 3);
          return (
            <Card key={item.id} className="bg-card/60 border-primary/20 hover:border-primary/40 transition-all group">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-primary mb-1">
                      <Sparkles className="w-3 h-3" /> Gerado por IA
                    </div>
                    <p className="font-semibold truncate">{roster.find(p=>p.id===item.aluno_id)?.nome || 'Aluno'}</p>
                  </div>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px]">Aguardando</Badge>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  {item.objetivo && <p><span className="text-foreground/60">Objetivo:</span> {item.objetivo}</p>}
                  {item.nivel && <p><span className="text-foreground/60">Nível:</span> {item.nivel}</p>}
                  <p><span className="text-foreground/60">Estrutura:</span> {dias} dias/semana</p>
                </div>

                {item.resumo && <p className="text-xs text-muted-foreground line-clamp-2">{item.resumo}</p>}

                <div className="flex gap-2 pt-2">
                  <CriarTreinoDialog
                    alunos={[{ id: item.aluno_id, nome: roster.find(p=>p.id===item.aluno_id)?.nome || 'Aluno' }]}
                    initialAlunoId={item.aluno_id} organizationId={item.organization_id || activeOrg?.id}
                    trigger={<Button size="sm" className="flex-1">Revisar e publicar</Button>}
                    onCriado={async () => {
                      const { error } = await supabase.from('treinos_ia_fila').update({ status: 'aprovado', aprovado_por: user?.id, aprovado_em: new Date().toISOString() }).eq('id', item.id);
                      if (error) toast.error('Treino publicado, mas a fila não foi atualizada. Atualize e confira antes de repetir.');
                      await carregar();
                    }} />
                  <Button size="sm" variant="outline" onClick={() => setDetail(item)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => rejeitar(item.id)}
                          className="text-destructive hover:text-destructive">
                    <XCircle className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Plano IA — {detail?.alunos?.nome}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Objetivo:</span> {detail.objetivo || '—'}</div>
                <div><span className="text-muted-foreground">Nível:</span> {detail.nivel || '—'}</div>
              </div>
              {detail.resumo && <p className="text-sm border-l-2 border-primary/40 pl-3">{detail.resumo}</p>}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Exercícios sugeridos</h3>
                <pre className="text-[11px] bg-muted/30 p-3 rounded overflow-x-auto max-h-96">
                  {JSON.stringify(detail.sugestao, null, 2)}
                </pre>
              </div>
              <div className="flex gap-2 pt-2">
                <p className="text-sm text-muted-foreground">Feche os detalhes e use Revisar e publicar para montar o treino no editor.</p>
                <Button variant="outline" onClick={() => setDetail(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
