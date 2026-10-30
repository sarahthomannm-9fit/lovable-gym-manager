import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIAS = ['funcional', 'musculação', 'alongamento', 'pilates', 'yoga', 'dança', 'outra'];
const hojeLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

export function NovaAulaDialog({ organizationId, professorId, onCriada }: { organizationId?: string; professorId?: string; onCriada: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ nome: '', data: '', inicio: '', fim: '', vagas: '10', categoria: 'funcional', local: '', semanas: '1' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const erro = !f.nome.trim() ? 'Informe o nome da aula'
    : !f.data || f.data < hojeLocal() ? 'Escolha uma data a partir de hoje'
    : !f.inicio || !f.fim || f.fim <= f.inicio ? 'O término deve ser depois do início'
    : !(Number(f.vagas) >= 1 && Number(f.vagas) <= 200) ? 'Vagas entre 1 e 200'
    : !(Number(f.semanas) >= 1 && Number(f.semanas) <= 12) ? 'Repetição entre 1 e 12 semanas' : '';

  const criar = async () => {
    if (erro || !organizationId || !professorId) return;
    setBusy(true);
    const { data, error } = await (supabase as any).rpc('create_aula', {
      p_org: organizationId, p_nome: f.nome.trim(), p_data: f.data, p_inicio: f.inicio, p_fim: f.fim,
      p_vagas: Number(f.vagas), p_categoria: f.categoria, p_local: f.local.trim() || null,
      p_professor_id: professorId, p_semanas: Number(f.semanas),
    });
    setBusy(false);
    if (error) { toast.error(error.message || 'Não foi possível criar a aula'); return; }
    const n = Array.isArray(data) ? data.length : 1;
    toast.success(n > 1 ? `${n} aulas criadas` : 'Aula criada');
    setOpen(false); setF({ ...f, nome: '', data: '', inicio: '', fim: '', local: '', semanas: '1' });
    onCriada();
  };

  const campo = 'h-12 w-full rounded-md border border-input bg-background px-3 text-base';
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1.5" />Nova aula</Button></DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova aula</DialogTitle><DialogDescription>A aula aparece para os moradores do condomínio.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1 text-sm font-medium">Nome<Input className="h-12" value={f.nome} onChange={set('nome')} maxLength={80} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-sm font-medium">Data<input type="date" className={campo} min={hojeLocal()} value={f.data} onChange={set('data')} /></label>
            <label className="block space-y-1 text-sm font-medium">Vagas<input type="number" inputMode="numeric" className={campo} min={1} max={200} value={f.vagas} onChange={set('vagas')} /></label>
            <label className="block space-y-1 text-sm font-medium">Início<input type="time" className={campo} value={f.inicio} onChange={set('inicio')} /></label>
            <label className="block space-y-1 text-sm font-medium">Término<input type="time" className={campo} value={f.fim} onChange={set('fim')} /></label>
          </div>
          <label className="block space-y-1 text-sm font-medium">Categoria
            <select className={campo} value={f.categoria} onChange={set('categoria')}>{CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          </label>
          <label className="block space-y-1 text-sm font-medium">Local (opcional)<Input className="h-12" value={f.local} onChange={set('local')} maxLength={80} placeholder="Ex.: Academia, salão" /></label>
          <label className="block space-y-1 text-sm font-medium">Repetir por quantas semanas?<input type="number" inputMode="numeric" className={campo} min={1} max={12} value={f.semanas} onChange={set('semanas')} /></label>
          {erro && f.nome && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={criar} disabled={!!erro || busy}>{busy ? 'Criando…' : 'Criar aula'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
