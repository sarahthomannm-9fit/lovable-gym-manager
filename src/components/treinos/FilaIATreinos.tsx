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
  const { user } = useAuth();
  const [items, setItems] = useState<FilaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aprovando, setAprovando] = useState<string | null>(null);
  const [detail, setDetail] = useState<FilaItem | null>(null);

  const carregar = async () => {
    setLoading(true);
    const query = supabase
      .from('treinos_ia_fila')
      .select('*, alunos(nome)')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) toast.error('Falha ao carregar fila');
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [activeOrg?.id]);

  const aprovar = async (item: FilaItem) => {
    setAprovando(item.id);
    try {
      const sug = item.sugestao || {};
      // 1. planos_treino
      const { data: plano, error: e1 } = await supabase.from('planos_treino').insert({
        nome: sug.nome || `Plano IA — ${item.alunos?.nome || 'Aluno'}`,
        descricao: item.resumo || sug.descricao || null,
        objetivo: item.objetivo || sug.objetivo || null,
        nivel: item.nivel || sug.nivel || null,
        semanas: sug.semanas || 4,
        dias_semana: sug.dias_semana || 3,
        organization_id: item.organization_id || activeOrg?.id || null,
        professor_id: null,
        ativo: true,
      }).select('id').single();
      if (e1) throw e1;

      // 2. plano_exercicios
      const exs: any[] = Array.isArray(sug.exercicios) ? sug.exercicios : [];
      if (exs.length) {
        const rows = exs.map((e, i) => ({
          plano_treino_id: plano.id,
          exercicio_id: e.exercicio_id,
          semana: e.semana ?? 1,
          dia_semana: e.dia_semana ?? ((i % 3) + 1),
          ordem: e.ordem ?? i + 1,
          series: e.series ?? 3,
          repeticoes: String(e.repeticoes ?? '10'),
          carga_kg: e.carga_kg ?? null,
          descanso_seg: e.descanso_seg ?? 60,
          observacoes: e.observacoes ?? null,
        })).filter(r => r.exercicio_id);
        if (rows.length) {
          const { error: e2 } = await supabase.from('plano_exercicios').insert(rows);
          if (e2) console.warn('plano_exercicios insert:', e2.message);
        }
      }

      // 3. treinos (vínculo com aluno)
      const hoje = new Date().toISOString().slice(0, 10);
      const fim = new Date(Date.now() + (sug.semanas || 4) * 7 * 86400000).toISOString().slice(0, 10);
      const { error: e3 } = await supabase.from('treinos').insert({
        aluno_id: item.aluno_id,
        descricao: item.resumo || sug.nome || 'Plano IA',
        data_inicio: hoje,
        data_fim: fim,
      });
      if (e3) throw e3;

      // 4. update fila
      await supabase.from('treinos_ia_fila').update({
        status: 'aprovado',
        aprovado_por: user?.id,
        aprovado_em: new Date().toISOString(),
        plano_treino_id: plano.id,
      }).eq('id', item.id);

      // 5. notificação
      await supabase.rpc('criar_notificacao', {
        p_tipo: 'treino',
        p_titulo: 'Seu novo treino chegou!',
        p_mensagem: 'Seu coach aprovou seu plano personalizado. Confira agora no app.',
        p_destinatario_id: item.aluno_id,
        p_destinatario_tipo: 'aluno',
        p_prioridade: 'alta',
        p_canal: ['app'],
      } as any);

      toast.success(`Treino aprovado e enviado a ${item.alunos?.nome || 'aluno'}`);
      carregar();
    } catch (err: any) {
      toast.error(`Falha ao aprovar: ${err.message}`);
    } finally {
      setAprovando(null);
    }
  };

  const rejeitar = async (id: string) => {
    await supabase.from('treinos_ia_fila').update({ status: 'rejeitado' }).eq('id', id);
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
                    <p className="font-semibold truncate">{item.alunos?.nome || 'Aluno'}</p>
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
                  <Button size="sm" onClick={() => aprovar(item)} disabled={aprovando === item.id}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {aprovando === item.id ? '…' : 'Aprovar'}
                  </Button>
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
                <Button onClick={() => { aprovar(detail); setDetail(null); }} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar e Enviar
                </Button>
                <Button variant="outline" onClick={() => setDetail(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
