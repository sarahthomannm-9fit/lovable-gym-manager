import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';

interface CriarTreinoDialogProps {
  alunos: { id: string; nome: string }[];
  organizationId?: string | null;
  onCriado: () => void;
}

interface ExercicioLinha {
  exercicio_id: string;
  nome: string;
  series: string;
  repeticoes: string;
  carga_kg: string;
  descanso_seg: string;
}

const linhaVazia = (): ExercicioLinha => ({
  exercicio_id: '', nome: '', series: '3', repeticoes: '12', carga_kg: '', descanso_seg: '60',
});

// Coach cria um treino do zero: escolhe o aluno, monta a lista de exercícios a partir
// da biblioteca, e ao salvar isso cria em sequência: planos_treino (o "molde" do plano),
// plano_exercicios (cada exercício da lista) e treinos (a instância atribuída ao aluno,
// apontando para o plano criado). Esse é o caminho que faltava — hoje só existe o
// caminho automático (IA gera → coach aprova em CoachHome > aba Fila).
export function CriarTreinoDialog({ alunos, organizationId, onCriado }: CriarTreinoDialogProps) {
  const [open, setOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [biblioteca, setBiblioteca] = useState<{ id: string; nome: string; grupo_muscular: string | null }[]>([]);

  const [alunoId, setAlunoId] = useState('');
  const [nomePlano, setNomePlano] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [nivel, setNivel] = useState('iniciante');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10));
  const [semanas, setSemanas] = useState('4');
  const [exercicios, setExercicios] = useState<ExercicioLinha[]>([linhaVazia()]);

  useEffect(() => {
    if (!open) return;
    supabase.from('exercicios_biblioteca')
      .select('id, nome, grupo_muscular')
      .eq('ativo', true)
      .order('grupo_muscular')
      .order('nome')
      .then(({ data }) => setBiblioteca(data || []));
  }, [open]);

  const resetForm = () => {
    setAlunoId(''); setNomePlano(''); setObjetivo(''); setNivel('iniciante');
    setDataInicio(new Date().toISOString().slice(0, 10)); setSemanas('4');
    setExercicios([linhaVazia()]);
  };

  const addLinha = () => setExercicios(prev => [...prev, linhaVazia()]);
  const removeLinha = (idx: number) => setExercicios(prev => prev.filter((_, i) => i !== idx));
  const updateLinha = (idx: number, patch: Partial<ExercicioLinha>) =>
    setExercicios(prev => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const selecionarExercicio = (idx: number, exercicioId: string) => {
    const ex = biblioteca.find(b => b.id === exercicioId);
    updateLinha(idx, { exercicio_id: exercicioId, nome: ex?.nome || '' });
  };

  const salvar = async () => {
    if (!alunoId) return toast.error('Escolha o aluno');
    if (!nomePlano.trim()) return toast.error('Dê um nome ao plano de treino');
    const validos = exercicios.filter(e => e.exercicio_id);
    if (validos.length === 0) return toast.error('Adicione pelo menos um exercício');

    setSalvando(true);
    try {
      const { data: plano, error: erroPlano } = await supabase.from('planos_treino')
        .insert({
          nome: nomePlano,
          objetivo: objetivo || null,
          nivel,
          semanas: Number(semanas) || 4,
          organization_id: organizationId || null,
          ativo: true,
          publico: false,
        })
        .select('id')
        .single();
      if (erroPlano || !plano) throw erroPlano || new Error('Falha ao criar plano');

      const linhasParaSalvar = validos.map((e, i) => ({
        plano_treino_id: plano.id,
        exercicio_id: e.exercicio_id,
        ordem: i + 1,
        series: Number(e.series) || null,
        repeticoes: e.repeticoes || null,
        carga_kg: e.carga_kg ? Number(e.carga_kg) : null,
        descanso_seg: Number(e.descanso_seg) || null,
      }));
      const { error: erroExercicios } = await supabase.from('plano_exercicios').insert(linhasParaSalvar);
      if (erroExercicios) throw erroExercicios;

      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() + (Number(semanas) || 4) * 7);

      const nomeAluno = alunos.find(a => a.id === alunoId)?.nome || 'aluno';
      const { error: erroTreino } = await supabase.from('treinos').insert({
        aluno_id: alunoId,
        plano_treino_id: plano.id,
        organization_id: organizationId || null,
        nome: nomePlano,
        descricao: `${nomePlano} — ${objetivo || 'plano personalizado'} (${validos.length} exercícios)`,
        data_inicio: dataInicio,
        data_fim: dataFim.toISOString().slice(0, 10),
        status: 'ativo',
      });
      if (erroTreino) throw erroTreino;

      toast.success(`Treino criado e enviado para ${nomeAluno}`);
      setOpen(false);
      resetForm();
      onCriado();
    } catch (err) {
      console.error(err);
      toast.error('Falha ao criar treino. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button style={{ backgroundColor: '#C8FF00', color: '#000' }} className="hover:opacity-90">
          <Plus className="w-4 h-4 mr-1.5" /> Novo treino
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" /> Criar treino
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Aluno</Label>
            <Select value={alunoId} onValueChange={setAlunoId}>
              <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
              <SelectContent>
                {alunos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Nome do plano</Label>
              <Input value={nomePlano} onChange={e => setNomePlano(e.target.value)}
                     placeholder="Ex.: Hipertrofia — fase 1" />
            </div>
            <div>
              <Label>Objetivo</Label>
              <Input value={objetivo} onChange={e => setObjetivo(e.target.value)}
                     placeholder="Ex.: Ganho de força e massa" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Nível</Label>
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Início</Label>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div>
              <Label>Duração (semanas)</Label>
              <Input type="number" min="1" value={semanas} onChange={e => setSemanas(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Exercícios</Label>
              <Button type="button" size="sm" variant="outline" onClick={addLinha}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar exercício
              </Button>
            </div>
            <div className="space-y-2">
              {exercicios.map((linha, idx) => (
                <Card key={idx} className="bg-card/60 border-border/40">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Select value={linha.exercicio_id} onValueChange={v => selecionarExercicio(idx, v)}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Escolha o exercício" /></SelectTrigger>
                        <SelectContent>
                          {biblioteca.map(b => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.nome} {b.grupo_muscular ? `· ${b.grupo_muscular}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {exercicios.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeLinha(idx)}>
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Séries</Label>
                        <Input value={linha.series} onChange={e => updateLinha(idx, { series: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Repetições</Label>
                        <Input value={linha.repeticoes} onChange={e => updateLinha(idx, { repeticoes: e.target.value })}
                               placeholder="Ex.: 12 ou 10-12" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Carga (kg)</Label>
                        <Input value={linha.carga_kg} onChange={e => updateLinha(idx, { carga_kg: e.target.value })}
                               placeholder="opcional" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={salvando}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}
                  style={{ backgroundColor: '#C8FF00', color: '#000' }} className="hover:opacity-90">
            {salvando ? 'Salvando…' : 'Criar e enviar ao aluno'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
