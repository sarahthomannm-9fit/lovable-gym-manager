import { useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { WEEKDAYS, localDate, validateWorkout, publicationPayload, type WorkoutDraft, type ExerciseDraft } from '@/lib/workout';

type LibraryExercise = { id: string; nome: string; grupo_muscular: string | null; equipamento: string | null };
interface Props {
  alunos: { id: string; nome: string }[]; organizationId?: string | null; onCriado: () => void;
  trigger?: ReactNode; initialAlunoId?: string;
}
const newDraft = (aluno = ''): WorkoutDraft => ({ requestId: crypto.randomUUID(), aluno_id: aluno, nome: '', objetivo: '', nivel: 'iniciante', data_inicio: localDate(), semanas: 4, exercicios: [] });
const selectClass = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

export function CriarTreinoDialog({ alunos, organizationId, onCriado, trigger, initialAlunoId }: Props) {
  const { user } = useAuth();
  const storageKey = `9fit:workout-draft:${user?.id}:${organizationId || 'global'}:${initialAlunoId || 'new'}`;
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState(false);
  const [draft, setDraft] = useState<WorkoutDraft>(() => newDraft(initialAlunoId));
  const [library, setLibrary] = useState<LibraryExercise[]>([]);
  const [search, setSearch] = useState('');
  const [day, setDay] = useState(1);
  const [libraryError, setLibraryError] = useState('');\n  const [infrastructureError, setInfrastructureError] = useState('');\n  const [safetyStatus, setSafetyStatus] = useState<'liberado' | 'pendente' | 'bloqueado' | 'desconhecido'>('desconhecido');\n  const [approvedEquipment, setApprovedEquipment] = useState<string[]>([]);\n  const [templates, setTemplates] = useState<{ id: string; nome: string; objetivo: string; nivel: string; descricao: string | null; sessoes_semana: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState('');

  const loadLibrary = async () => {
    setLoading(true); setLibraryError('');
    try {
      let q = supabase.from('exercicios_biblioteca').select('id,nome,grupo_muscular,equipamento').eq('ativo', true).order('nome');
      if (organizationId) q = q.or(`organization_id.is.null,organization_id.eq.${organizationId}`);
      const { data, error } = await q;
      if (error) throw error;
      const available = (data || []).filter((exercise: LibraryExercise) => !exercise.equipamento || equipment.length === 0 || equipment.some((item: string) => item.includes(String(exercise.equipamento).toLocaleLowerCase()) || String(exercise.equipamento).toLocaleLowerCase().includes(item)));\n      setLibrary(available);
    } catch { setLibraryError('Não foi possível carregar a biblioteca.'); }
    finally { setLoading(false); }
  };
  const changeOpen = (value: boolean) => {
    if (busy.current) return;
    if (value) {
      let restored = newDraft(initialAlunoId);
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (saved?.requestId && Array.isArray(saved.exercicios)) restored = saved;
      } catch { /* A malformed local draft must not prevent opening the editor. */ }
      setDraft(restored); setReview(false); setError(''); void loadLibrary();
    }
    setOpen(value);
  };
  useEffect(() => {
    if (!open) return;
    try { localStorage.setItem(storageKey, JSON.stringify(draft)); } catch { setError('Não foi possível salvar o rascunho neste dispositivo.'); }
  }, [draft, open, storageKey]);
  const patch = (value: Partial<WorkoutDraft>) => { setDraft(d => ({ ...d, ...value })); setError(''); };
  const editExercise = (key: string, value: Partial<ExerciseDraft>) => patch({ exercicios: draft.exercicios.map(e => e.key === key ? { ...e, ...value } : e) });
  const add = (ex: LibraryExercise) => patch({ exercicios: [...draft.exercicios, { key: crypto.randomUUID(), exercicio_id: ex.id, nome: ex.nome, dia_semana: day, series: 3, repeticoes: '12', carga_kg: '', descanso_seg: 60, observacoes: '' }] });
  const move = (index: number, offset: number) => {
    const next = [...draft.exercicios]; const target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]]; patch({ exercicios: next });
  };
  const publish = async () => {
    if (busy.current) return;
    const validation = validateWorkout(draft);
    if (validation) return setError(validation);
    if (!alunos.some(a => a.id === draft.aluno_id)) return setError('O aluno não está mais disponível neste contexto.');
    busy.current = true; setSaving(true); setError('');
    try {
      const { error } = await supabase.rpc('publish_workout', { p_request_id: draft.requestId, p_payload: publicationPayload(draft) });
      if (error) throw error;
      try { localStorage.removeItem(storageKey); } catch { /* Publication already succeeded. */ }
      setOpen(false); setDraft(newDraft(initialAlunoId));
      toast.success('Treino publicado no aplicativo do aluno.'); onCriado();
    } catch (err) {
      setError((err as { message?: string }).message || 'Não foi possível publicar. Seu rascunho foi preservado.');
    } finally { busy.current = false; setSaving(false); }
  };
  const matches = library.filter(e => `${e.nome} ${e.grupo_muscular || ''} ${e.equipamento || ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild>{trigger || <Button><Plus className="w-4 h-4 mr-1" />Novo treino</Button>}</DialogTrigger>
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{review ? 'Revisar e publicar treino' : 'Criar treino para o aluno'}</DialogTitle></DialogHeader>
      <p className="text-xs text-muted-foreground">Rascunho salvo neste dispositivo. A programação se repete a cada semana durante a validade.</p>
      {error && <div role="alert" className="rounded border border-destructive p-3 text-sm">{error}</div>}\n      {infrastructureError && <div role="alert" className="rounded border border-amber-500 p-3 text-sm text-amber-700">{infrastructureError} Aprove o inventário antes de publicar um protocolo. Exercícios sem equipamento ou compatíveis com o inventário aprovado permanecem disponíveis.</div>}\n      {draft.aluno_id && <div className={`rounded border p-3 text-sm ${safetyStatus === 'liberado' ? 'border-emerald-500 text-emerald-700' : 'border-amber-500 text-amber-700'}`}>Segurança do aluno: <strong>{safetyStatus === 'liberado' ? 'liberada' : safetyStatus === 'bloqueado' ? 'bloqueada' : 'aguardando avaliação'}</strong></div>}
      <fieldset disabled={saving} className="space-y-4 min-w-0">
      {!review ? <>
        <label className="block text-sm">Aluno<select className={selectClass} value={draft.aluno_id} onChange={e => patch({ aluno_id: e.target.value })}><option value="">Escolha o aluno</option>{alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}</select></label>
        <div className="grid sm:grid-cols-2 gap-3"><label>Começar por protocolo<select className="w-full rounded-md border bg-background px-3 py-2 text-sm" onChange={(e) => { const template = templates.find((item) => item.id === e.target.value); if (template) { const seeded = library.slice(0, Math.min(6, library.length)).map((exercise: LibraryExercise, index: number) => ({ key: crypto.randomUUID(), exercicio_id: exercise.id, nome: exercise.nome, dia_semana: [1, 3, 5][index % 3], series: 3, repeticoes: '12', carga_kg: '', descanso_seg: 60, observacoes: '' })); setDraft((current) => ({ ...current, nome: template.nome, objetivo: template.objetivo, nivel: template.nivel, semanas: Math.max(1, template.sessoes_semana), exercicios: seeded })); } }}><option value="">Montar do zero</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.nome} · {template.objetivo}</option>)}</select></label></div><div className="grid sm:grid-cols-2 gap-3">
          <label>Nome do treino<Input value={draft.nome} onChange={e => patch({ nome: e.target.value })} /></label>
          <label>Objetivo<Input value={draft.objetivo} onChange={e => patch({ objetivo: e.target.value })} /></label>
          <label>Início<Input type="date" value={draft.data_inicio} onChange={e => patch({ data_inicio: e.target.value })} /></label>
          <label>Semanas<Input type="number" min={1} max={52} value={draft.semanas} onChange={e => patch({ semanas: Number(e.target.value) })} /></label>
          <label>Nível<select className={selectClass} value={draft.nivel} onChange={e => patch({ nivel: e.target.value })}>{['iniciante','intermediario','avancado'].map(n => <option key={n}>{n}</option>)}</select></label>
        </div>
        <section className="rounded border p-3 space-y-2" aria-label="Biblioteca de exercícios">
          <label>Buscar exercício, grupo muscular ou equipamento<Input value={search} onChange={e => setSearch(e.target.value)} /></label>
          <label>Adicionar ao dia<select className={selectClass} value={day} onChange={e => setDay(Number(e.target.value))}>{WEEKDAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select></label>
          {loading ? <p role="status">Carregando biblioteca…</p> : libraryError ? <div role="alert">{libraryError}<Button variant="outline" onClick={loadLibrary}>Tentar novamente</Button></div> : <div className="max-h-40 overflow-y-auto">
            {matches.map(ex => <div key={ex.id} className="flex items-center justify-between gap-2 py-2 border-b"><span className="text-sm">{ex.nome}<small className="block text-muted-foreground">{ex.grupo_muscular} · {ex.equipamento}</small></span><Button size="sm" variant="outline" onClick={() => add(ex)} aria-label={`Adicionar ${ex.nome}`}>Adicionar</Button></div>)}
            {!matches.length && <p className="text-sm">{library.length ? 'Nenhum resultado. Tente outra busca.' : 'Nenhum exercício disponível. Cadastre exercícios na biblioteca antes de publicar.'}</p>}
          </div>}
        </section>
      </> : <div><h3 className="font-semibold">{draft.nome}</h3><p>{alunos.find(a => a.id === draft.aluno_id)?.nome} · {draft.semanas} semanas · Início {draft.data_inicio}</p><p>{draft.objetivo}</p></div>}
      {draft.exercicios.map((ex, index) => <section key={ex.key} className="rounded border p-3 space-y-2">
        <div className="flex items-center justify-between gap-2"><strong>{index + 1}. {ex.nome}</strong>{!review && <div className="flex">
          <Button size="icon" variant="ghost" disabled={index === 0} aria-label={`Mover ${ex.nome} para cima`} onClick={() => move(index, -1)}><ArrowUp className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" disabled={index === draft.exercicios.length - 1} aria-label={`Mover ${ex.nome} para baixo`} onClick={() => move(index, 1)}><ArrowDown className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" aria-label={`Duplicar ${ex.nome}`} onClick={() => patch({ exercicios: [...draft.exercicios, { ...ex, key: crypto.randomUUID() }] })}><Copy className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" aria-label={`Remover ${ex.nome}`} onClick={() => patch({ exercicios: draft.exercicios.filter(e => e.key !== ex.key) })}><Trash2 className="w-4 h-4" /></Button>
        </div>}</div>
        {review ? <p className="text-sm">{WEEKDAYS[ex.dia_semana - 1]} · {ex.series} × {ex.repeticoes} · {ex.carga_kg || '0'} kg · Descanso {ex.descanso_seg}s<br />{ex.observacoes}</p> : <>
          <label>Dia<select className={selectClass} value={ex.dia_semana} onChange={e => editExercise(ex.key, { dia_semana: Number(e.target.value) })}>{WEEKDAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select></label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label>Séries<Input type="number" min={1} max={30} value={ex.series} onChange={e => editExercise(ex.key, { series: Number(e.target.value) })} /></label>
            <label>Repetições<Input value={ex.repeticoes} onChange={e => editExercise(ex.key, { repeticoes: e.target.value })} /></label>
            <label>Carga (kg)<Input type="number" min={0} step="0.5" value={ex.carga_kg} onChange={e => editExercise(ex.key, { carga_kg: e.target.value })} /></label>
            <label>Descanso (s)<Input type="number" min={0} max={1800} value={ex.descanso_seg} onChange={e => editExercise(ex.key, { descanso_seg: Number(e.target.value) })} /></label>
          </div>
          <label>Orientação / alternativa<Textarea value={ex.observacoes} onChange={e => editExercise(ex.key, { observacoes: e.target.value })} /></label>
        </>}
      </section>)}
      </fieldset>
      <DialogFooter className="gap-2">
        <Button variant="ghost" disabled={saving} onClick={() => { try { localStorage.removeItem(storageKey); } catch { /* local storage unavailable */ } setDraft(newDraft(initialAlunoId)); setOpen(false); }}>Descartar rascunho</Button>
        <Button variant="outline" disabled={saving} onClick={() => review ? setReview(false) : changeOpen(false)}>{review ? 'Voltar e editar' : 'Salvar e fechar'}</Button>
        <Button disabled={saving} onClick={() => { if (review) void publish(); else { const err = validateWorkout(draft); if (err) setError(err); else setReview(true); } }}>{saving ? 'Publicando…' : review ? 'Publicar no app do aluno' : 'Revisar treino'}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
