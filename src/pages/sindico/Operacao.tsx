import { FitnessInfrastructure } from "@/components/FitnessInfrastructure";
import { useSearchParams } from "react-router-dom";
import { PersonaLayout, PersonaEmptyState } from "@/layouts/PersonaLayout";
import { useOperationalContext } from "@/hooks/useOperationalContext";
import { CommonAreaOperations } from "@/components/admin/CommonAreaOperations";
import { ServiceRequestsBoard } from "@/components/admin/ServiceRequestsBoard";
import { SupportTickets } from "@/components/SupportTickets";
import { Button } from "@/components/ui/button";
export default function SindicoOperacao() {
  const { activeOrg } = useOperationalContext();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "chamados";
  return (
    <PersonaLayout title="Atendimento" subtitle={activeOrg?.nome || ""}>
      {!activeOrg ? (
        <PersonaEmptyState />
      ) : (
        <div className="mx-auto max-w-4xl space-y-5">
          <h1 className="text-3xl font-semibold">Atendimento do condomínio</h1>
          <p className="text-sm text-muted-foreground">
            Escolha a categoria e abra a solicitação. Proposta, aceite do
            morador e conclusão são etapas diferentes.
          </p>
          <nav
            aria-label="Categorias de atendimento"
            className="flex flex-wrap gap-2"
          >
            {[
              ["chamados", "Chamados"],
              ["equipamentos", "Academia"],
              ["reservas", "Reservas"],
              ["servicos", "Serviços"],
              ["ajuda", "Pedir apoio"],
            ].map(([value, label]) => (
              <Button
                key={value}
                variant={category === value ? "default" : "outline"}
                onClick={() => setParams({ category: value })}
              >
                {label}
              </Button>
            ))}
          </nav>
          {category === "equipamentos" ? (
            <FitnessInfrastructure
              key={activeOrg.id}
              orgId={activeOrg.id}
              manage
            />
          ) : category === "reservas" ? (
            <CommonAreaOperations
              key={activeOrg.id}
              orgId={activeOrg.id}
              compact
            />
          ) : category === "servicos" ? (
            <ServiceRequestsBoard
              key={activeOrg.id}
              orgId={activeOrg.id}
              compact
            />
          ) : (
            <SupportTickets
              key={activeOrg.id + ":" + category}
              orgId={activeOrg.id}
              manage={category !== "ajuda"}
            />
          )}
        </div>
      )}
    </PersonaLayout>
  );
}
