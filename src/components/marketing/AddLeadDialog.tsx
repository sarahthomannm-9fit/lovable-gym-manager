
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseLeads } from "@/hooks/marketing/useSupabaseLeads";
import { useToast } from "@/components/ui/use-toast";

export function AddLeadDialog() {
  const { addLead } = useSupabaseLeads();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    fonte: "",
    status: "novo",
    score: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.nome) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    await addLead({
      nome: form.nome,
      email: form.email || null,
      telefone: form.telefone || null,
      fonte: form.fonte || null,
      status: (form.status as any) || "novo",
      score: form.score ? Number(form.score) : null,
      observacoes: null,
      created_at: "" as any,
      updated_at: "" as any,
      id: "" as any,
    } as any);
    toast({ title: "Lead cadastrado com sucesso" });
    setOpen(false);
    setForm({ nome: "", email: "", telefone: "", fonte: "", status: "novo", score: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Adicionar Lead</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Nome</Label>
            <Input name="nome" value={form.nome} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>E-mail</Label>
              <Input name="email" value={form.email} onChange={handleChange} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input name="telefone" value={form.telefone} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Fonte</Label>
              <Input name="fonte" value={form.fonte} onChange={handleChange} placeholder="Instagram, Google Ads..." />
            </div>
            <div>
              <Label>Status</Label>
              <Input name="status" value={form.status} onChange={handleChange} placeholder="novo, qualificado..." />
            </div>
            <div>
              <Label>Score</Label>
              <Input name="score" value={form.score} onChange={handleChange} placeholder="0-100" />
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
