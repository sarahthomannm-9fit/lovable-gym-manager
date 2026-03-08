
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Folder, FolderOpen } from "lucide-react";
import { SupabasePlan } from "@/hooks/useSupabasePlans";

type PlanType = SupabasePlan;

interface PlansOrganizationProps {
  plans: SupabasePlan[];
  onSelectOrganization?: (orgId: string) => void;
}

interface PlanOrganization {
  id: string;
  name: string;
  description: string;
  plans: SupabasePlan[];
}

export function PlansOrganization({ plans, onSelectOrganization }: PlansOrganizationProps) {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const organizations: PlanOrganization[] = [
    {
      id: "mensal",
      name: "Planos Mensais",
      description: "Planos com recorrência mensal",
      plans: plans.filter(p => p.tipo === 'mensal' || !p.tipo)
    },
    {
      id: "pacote",
      name: "Pacotes de Aulas",
      description: "Pacotes com quantidade fixa de aulas",
      plans: plans.filter(p => (p.tipo as string) === 'pacote_aulas' && (p.quantidade_aulas || 0) > 0)
    },
    {
      id: "consultoria",
      name: "Consultoria Online",
      description: "Planos de acompanhamento remoto",
      plans: plans.filter(p => (p.tipo as string) === 'consultoria')
    },
    {
      id: "outros",
      name: "Outros Planos",
      description: "Trimestral, semestral, anual e avulso",
      plans: plans.filter(p => ['trimestral', 'semestral', 'anual', 'avulso'].includes(p.tipo || ''))
    }
  ];

  const handleSelectOrganization = (orgId: string) => {
    setSelectedOrg(selectedOrg === orgId ? null : orgId);
    onSelectOrganization?.(orgId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Building2 className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Organização de Planos</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {organizations.map((org) => (
          <Card key={org.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3" onClick={() => handleSelectOrganization(org.id)}>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {selectedOrg === org.id ? (
                    <FolderOpen className="w-5 h-5 text-primary" />
                  ) : (
                    <Folder className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span>{org.name}</span>
                </div>
                <Badge variant="secondary">{org.plans.length} planos</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{org.description}</p>
            </CardHeader>

            {selectedOrg === org.id && (
              <CardContent>
                <div className="space-y-3">
                  {org.plans.length > 0 ? (
                    <div className="space-y-2">
                      {org.plans.map((plan) => (
                        <div key={plan.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{plan.nome}</div>
                            <div className="text-sm text-muted-foreground">
                              R$ {Number(plan.preco).toFixed(2)}
                              {plan.duracao_meses && ` - ${plan.duracao_meses} ${plan.duracao_meses === 1 ? 'mês' : 'meses'}`}
                            </div>
                          </div>
                          <Badge variant={(plan.ativo ?? true) ? "default" : "secondary"}>
                            {(plan.ativo ?? true) ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">Nenhum plano nesta categoria</p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {selectedOrg && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setSelectedOrg(null)}>Fechar Visualização</Button>
        </div>
      )}
    </div>
  );
}
