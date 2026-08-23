import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';

interface CriarEventoDialogProps {
  organizationId: string;
  onCriado: () => void;
  accent: string;
}

export function CriarEventoDialog({ organizationId, onCriado, accent }: CriarEventoDialogProps) {
  const [open, setOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [local, setLocal] = useState('');

  const reset = () => {
    setNome(''); setDescricao(''); setData(''); setHorarioInicio(''); setHorarioFim(''); setLocal('');
  };

  const salvar = async () => {
    if (!nome.trim()) return toast.error('Dê um nome ao evento');
    if (!data) return toast.error('Escolha a data do evento');
    setSalvando(true);
    const { error } = await supabase.from('eventos_condominio').insert({
      organization_id: organizationId,
      nome,
      descricao: descricao || null,
      data_evento: data,
      horario_inicio: horarioInicio || null,
      horario_fim: horarioFim || null,
      local: local || null,
    });
    setSalvando(false);
    if (error) return toast.error('Falha ao criar evento');
    toast.success('Evento publicado');
    setOpen(false);
    reset();
    onCriado();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" style={{ borderColor: `${accent}66`, color: accent }}>
          <CalendarPlus className="w-4 h-4 mr-1.5" /> Novo evento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar evento do condomínio</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Health Day de Agosto" />
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2}
                      placeholder="Ex.: Avaliação física, postural e nutricional gratuita" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Data</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div>
              <Label>Início</Label>
              <Input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="time" value={horarioFim} onChange={e => setHorarioFim(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Local (opcional)</Label>
            <Input value={local} onChange={e => setLocal(e.target.value)} placeholder="Ex.: Salão de Festas" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={salvando}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando} style={{ backgroundColor: accent, color: '#000' }}>
            {salvando ? 'Salvando…' : 'Publicar evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
