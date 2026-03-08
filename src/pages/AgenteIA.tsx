import { AIAgent } from "@/components/AIAgent";

export function AgenteIA() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Agente IA</h2>
        <p className="text-muted-foreground">Converse com especialistas de IA sobre seus dados</p>
      </div>
      <AIAgent />
    </div>
  );
}
