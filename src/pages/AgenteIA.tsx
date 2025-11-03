import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { AIAgent } from "@/components/AIAgent";

export function AgenteIA() {
  return (
    <ResponsiveLayout 
      activeView="agente-ia" 
      onViewChange={() => {}} 
      title="Agente IA"
      subtitle="Converse com especialistas de IA sobre seus dados"
    >
      <AIAgent />
    </ResponsiveLayout>
  );
}
