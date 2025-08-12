
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabasePromotions } from "@/hooks/marketing/useSupabasePromotions";
import { useToast } from "@/components/ui/use-toast";

export function AddPromotionDialog() {
  const { addPromotion } = useSupabasePromotions();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    desconto: "",
    tipo: "",
    status: "ativa",
    valido_ate: "",
    limite: "",
    descricao: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.nome || !form.desconto) {
      toast({ title: "Nome e Desconto são obrigatórios", variant: "destructive" });
      return;
    }
    await addPromotion({
      nome: form.nome,
      desconto: form.desconto,
      tipo: form.tipo || null,
      status: form.status as any,
      valido_ate: form.valido_ate || null,
      usado: 0,
      limite: form.limite ? Number(form.limite) : null,
      descricao: form.descricao || null,
      id: "" as any,
      created_at: "" as any,
      updated_at: "" as any,
    } as any);
    toast({ title: "Promoção criada" });
    setOpen(false);
    setForm({ nome: "", desconto: "", tipo: "", status: "ativa", valido_ate: "", limite: "", descricao: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova Promoção</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Promoção</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome</Label>
              <Input name="nome" value={form.nome} onChange={handleChange} />
            </div>
            <div>
              <Label>Desconto</Label>
              <Input name="desconto" value={form.desconto} onChange={handleChange} placeholder="Ex: 50% ou 1 mês grátis" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Tipo</Label>
              <Input name="tipo" value={form.tipo} onChange={handleChange} placeholder="Captacao, Sazonal..." />
            </div>
            <div>
              <Label>Status</Label>
              <Input name="status" value={form.status} onChange={handleChange} placeholder="ativa, pausada, finalizada" />
            </div>
            <div>
              <Label>Limite (opcional)</Label>
              <Input name="limite" value={form.limite} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Válido até</Label>
              <Input name="valido_ate" type="date" value={form.valido_ate} onChange={handleChange} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input name="descricao" value={form.descricao} onChange={handleChange} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
