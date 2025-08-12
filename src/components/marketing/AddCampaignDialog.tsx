
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseCampaigns } from "@/hooks/marketing/useSupabaseCampaigns";
import { useToast } from "@/components/ui/use-toast";

export interface AddCampaignDialogProps {
  triggerLabel?: string;
  initialCategoria?: string;
  initialTitulo?: string;
}

export function AddCampaignDialog({ triggerLabel = "Nova Campanha", initialCategoria, initialTitulo }: AddCampaignDialogProps) {
  const { addCampaign } = useSupabaseCampaigns();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    categoria: "",
    status: "ativa",
    canal: "",
    orcamento: "",
    data_inicio: "",
    data_fim: "",
    descricao: "",
  });

  useEffect(() => {
    if (open) {
      setForm((f) => ({
        ...f,
        categoria: initialCategoria || f.categoria,
        titulo: initialTitulo || f.titulo,
      }));
    }
  }, [open, initialCategoria, initialTitulo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.titulo || !form.categoria) {
      toast({ title: "Título e Categoria são obrigatórios", variant: "destructive" });
      return;
    }
    await addCampaign({
      titulo: form.titulo,
      categoria: form.categoria as any,
      status: form.status as any,
      canal: form.canal || null,
      orcamento: form.orcamento ? Number(form.orcamento) : null,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
      descricao: form.descricao || null,
      alcance: 0,
      conversoes: 0,
      segmento: null,
      id: "" as any,
      created_at: "" as any,
      updated_at: "" as any,
    } as any);
    toast({ title: "Campanha criada" });
    setOpen(false);
    setForm({
      titulo: "",
      categoria: "",
      status: "ativa",
      canal: "",
      orcamento: "",
      data_inicio: "",
      data_fim: "",
      descricao: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Campanha</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Título</Label>
              <Input name="titulo" value={form.titulo} onChange={handleChange} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input name="categoria" value={form.categoria} onChange={handleChange} placeholder="captacao, comunicacao, conversao, email, promocao" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Status</Label>
              <Input name="status" value={form.status} onChange={handleChange} placeholder="ativa, pausada, finalizada" />
            </div>
            <div>
              <Label>Canal</Label>
              <Input name="canal" value={form.canal} onChange={handleChange} placeholder="whatsapp, email, instagram..." />
            </div>
            <div>
              <Label>Orçamento (R$)</Label>
              <Input name="orcamento" value={form.orcamento} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início</Label>
              <Input name="data_inicio" type="date" value={form.data_inicio} onChange={handleChange} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input name="data_fim" type="date" value={form.data_fim} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input name="descricao" value={form.descricao} onChange={handleChange} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
