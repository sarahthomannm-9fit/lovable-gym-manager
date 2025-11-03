import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { AutomationFlows } from "@/components/marketing/AutomationFlows";

export function Automacao() {
  return (
    <ResponsiveLayout 
      activeView="automacao" 
      onViewChange={() => {}} 
      title="Automação de Marketing"
      subtitle="Gerencie fluxos automáticos de comunicação"
    >
      <AutomationFlows />
    </ResponsiveLayout>
  );
}
