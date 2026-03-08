import { AutomationFlows } from "@/components/marketing/AutomationFlows";

export function Automacao() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Automação de Marketing</h2>
        <p className="text-muted-foreground">Gerencie fluxos automáticos de comunicação</p>
      </div>
      <AutomationFlows />
    </div>
  );
}
