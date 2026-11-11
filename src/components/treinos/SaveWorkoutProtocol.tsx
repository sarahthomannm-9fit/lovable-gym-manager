import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const goals = [
  "Força",
  "Postural e mobilidade",
  "Cardio",
  "Hipertrofia",
  "Emagrecimento",
  "Funcional",
];
const levels = ["iniciante", "intermediário", "avançado"];

export function SaveWorkoutProtocol({ workoutId }: { workoutId: string }) {
  const locked = useRef(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    const fields = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      const { error } = await supabase.rpc("create_protocol_from_workout", {
        p_workout: workoutId,
        p_name: String(fields.get("nome")),
        p_goal: String(fields.get("objetivo")),
        p_level: String(fields.get("nivel")),
      });
      if (error) return setError(error.message);
      toast.success("Protocolo disponível para o condomínio.");
      setOpen(false);
    } catch {
      setError("Não foi possível salvar o protocolo. Tente novamente.");
    } finally {
      locked.current = false;
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) {
          setOpen(next);
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Salvar como protocolo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo protocolo do condomínio</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O protocolo usa os exercícios, dias, séries, repetições e descanso
            da primeira semana. Cargas e observações individuais ficam no treino
            do aluno.
          </p>
          <label className="block">
            Nome do protocolo
            <Input name="nome" required minLength={2} maxLength={120} />
          </label>
          <label className="block">
            Objetivo
            <select
              name="objetivo"
              required
              defaultValue=""
              className="block w-full rounded-md border bg-background p-2"
            >
              <option value="" disabled>
                Selecione um objetivo
              </option>
              {goals.map((goal) => (
                <option key={goal}>{goal}</option>
              ))}
            </select>
          </label>
          <label className="block">
            Nível
            <select
              name="nivel"
              className="block w-full rounded-md border bg-background p-2"
            >
              {levels.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required className="mt-1" />
            Revisei os parâmetros para reutilização neste condomínio.
          </label>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando…" : "Salvar protocolo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
