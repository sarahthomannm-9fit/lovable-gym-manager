import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SupabaseStudent } from '@/hooks/useSupabaseStudents';

interface AddTrainingDialogProps {
  students: SupabaseStudent[];
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function AddTrainingDialog({ students, onSuccess, trigger }: AddTrainingDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    aluno_id: '',
    descricao: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.aluno_id || !formData.descricao || !formData.data_inicio || !formData.data_fim) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('treinos').insert({
        aluno_id: formData.aluno_id,
        descricao: formData.descricao,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
      });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Treino criado com sucesso!" });
      setFormData({ aluno_id: '', descricao: '', data_inicio: new Date().toISOString().split('T')[0], data_fim: '' });
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating training:', error);
      toast({ title: "Erro", description: "Não foi possível criar o treino", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activeStudents = students.filter(s => s.status === 'ativo');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Treino
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Treino</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Aluno *</Label>
            <Select value={formData.aluno_id} onValueChange={(value) => setFormData(prev => ({ ...prev, aluno_id: value }))}>
              <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
              <SelectContent>
                {activeStudents.map(aluno => (
                  <SelectItem key={aluno.id} value={aluno.id}>{aluno.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição do Treino *</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Ex: Treino A - Superior (Peito, Ombro, Tríceps)"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_inicio">Data Início *</Label>
              <Input id="data_inicio" type="date" value={formData.data_inicio} onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="data_fim">Data Fim *</Label>
              <Input id="data_fim" type="date" value={formData.data_fim} onChange={(e) => setFormData(prev => ({ ...prev, data_fim: e.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Criando..." : "Criar Treino"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
