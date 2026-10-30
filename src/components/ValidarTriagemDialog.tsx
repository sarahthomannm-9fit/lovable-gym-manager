import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export type Triagem = {
  aluno_id: string; consentimento: boolean; risco: string; restricoes: string[]; lesoes_atuais: string[];
  historico_lesoes: string | null; cirurgias: string | null; dor_atual: boolean; sinais_alerta: string[];
  observacoes: string | null; objetivo: string | null; validado_por: string | null; review_notes: string | null;
};

export type TriagemStatus = 'sem_resposta' | 'aguardando' | 'bloqueado' | 'restricao' | 'liberada';

export const triagemStatus = (t?: Triagem | null): TriagemStatus => {
  if (!t || !t.consentimento) return 'sem_resposta';
  if (!t.validado_por) return 'aguardando';
  if (t.risco === 'bloqueado') return 'bloqueado';
  if (t.risco === 'baixo' && (t.restricoes || []).length) return 'restricao';
  return t.risco === 'baixo' ? 'liberada' : 'aguardando';
};

export const TRIAGEM_LABEL: Record<TriagemStatus, string> = {
  sem_resposta: 'Triagem não respondida', aguardando: 'Aguardando validação',
  bloqueado: 'Bloqueado — avaliação necessária', restricao: 'Liberado com restrição', liberada: 'Liberado',
};

// Vocabulário igual ao de exercicios_biblioteca.restricoes_incompativeis.
export const REGIOES = ['joelho', 'ombro', 'lombar', 'quadril', 'cervical', 'punho', 'tornozelo'];

type Decisao = 'liberar' | 'liberar_restricoes' | 'bloquear';

export function ValidarTriagemDialog({ aluno, triagem, onClose, onDone }: {
  aluno: { id: string; nome: string } | null; triagem?: Triagem | null; onClose: () => void; onDone: () => void;
}) {
  const alerta = !!triagem && (triagem.dor_atual || (triagem.sinais_alerta || []).length > 0);
  const [decisao, setDecisao] = useState<Decisao | ''>('');
  const [restr, setRestr] = useState<string[]>([]);
  const [notas, setNotas] = useState('');
  const [busy, setBusy] = useState(false);

  const notasObrigatorias = decisao === 'bloquear' || (decisao === 'liberar_restricoes' && alerta);
  const invalido = !decisao || (decisao === 'liberar' && alerta) || (decisao === 'liberar_restricoes' && !restr.length && !notas.trim()) || (notasObrigatorias && !notas.trim());

  const salvar = async () => {
    if (!aluno || !decisao) return;
    setBusy(true);
    const { error } = await (supabase as any).rpc('validate_safety_screening', {
      p_aluno_id: aluno.id, p_decisao: decisao, p_restricoes: decisao === 'liberar' ? [] : restr, p_notas: notas.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message || 'Não foi possível salvar a decisão'); return; }
    toast.success(decisao === 'bloquear' ? 'Aluno bloqueado até avaliação' : 'Triagem validada');
    setDecisao(''); setRestr([]); setNotas('');
    onDone(); onClose();
  };

  const linha = (rotulo: string, valor?: string | string[] | null) => {
    const v = Array.isArray(valor) ? valor.join(', ') : valor;
    return <div className="text-sm"><span className="text-muted-foreground">{rotulo}: </span>{v?.trim() ? v : 'Nenhum'}</div>;
  };

  return (
    <Dialog open={!!aluno} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validar triagem — {aluno?.nome}</DialogTitle>
          <DialogDescription>O aluno respondeu; a decisão de liberar é sua.</DialogDescription>
        </DialogHeader>
        {triagem && (
          <div className="space-y-1.5 rounded-md border border-border/40 p-3">
            {alerta && <p role="alert" className="text-sm font-medium text-amber-700">Atenção: {triagem.dor_atual ? 'dor atual' : ''}{triagem.dor_atual && triagem.sinais_alerta.length ? ' e ' : ''}{triagem.sinais_alerta.length ? 'sinais de alerta' : ''}</p>}
            {linha('Objetivo', triagem.objetivo)}
            {linha('Lesões atuais', triagem.lesoes_atuais)}
            {linha('Sinais de alerta', triagem.sinais_alerta)}
            {linha('Histórico de lesões', triagem.historico_lesoes)}
            {linha('Cirurgias', triagem.cirurgias)}
            {linha('Observações do aluno', triagem.observacoes)}
          </div>
        )}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium mb-1">Decisão</legend>
          {([
            ['liberar', 'Liberar', alerta ? 'Indisponível: há dor ou sinais de alerta' : 'Sem restrições'],
            ['liberar_restricoes', 'Liberar com restrições', 'Os exercícios incompatíveis ficam de fora na montagem'],
            ['bloquear', 'Bloquear até avaliação', 'O aluno é orientado a procurar avaliação'],
          ] as [Decisao, string, string][]).map(([v, t, d]) => (
            <label key={v} className={`flex items-start gap-3 min-h-12 rounded-md border p-3 ${decisao === v ? 'border-primary bg-primary/5' : 'border-border/40'} ${v === 'liberar' && alerta ? 'opacity-50' : ''}`}>
              <input type="radio" name="decisao" className="mt-1 h-4 w-4" disabled={v === 'liberar' && alerta} checked={decisao === v} onChange={() => setDecisao(v)} />
              <span><span className="block text-sm font-medium">{t}</span><span className="block text-xs text-muted-foreground">{d}</span></span>
            </label>
          ))}
        </fieldset>
        {decisao === 'liberar_restricoes' && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Regiões com restrição</p>
            <div className="flex flex-wrap gap-2">
              {REGIOES.map((r) => {
                const on = restr.includes(r);
                return <button key={r} type="button" aria-pressed={on} onClick={() => setRestr(on ? restr.filter((x) => x !== r) : [...restr, r])}
                  className={`h-11 px-4 rounded-full border text-sm capitalize ${on ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{r}</button>;
              })}
            </div>
          </div>
        )}
        {decisao && decisao !== 'liberar' && (
          <label className="block space-y-1.5 text-sm font-medium">Observação do professor{notasObrigatorias ? ' (obrigatória)' : ''}
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={1000} rows={3} />
          </label>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={invalido || busy}>{busy ? 'Salvando…' : 'Confirmar decisão'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
