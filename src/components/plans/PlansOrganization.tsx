
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Folder, FolderOpen } from "lucide-react";

interface Plan {
  id: number;
  name: string;
  price: number;
  duration: number;
  benefits: string[];
  active: boolean;
}

interface PlansOrganizationProps {
  plans: Plan[];
  onSelectOrganization?: (orgId: string) => void;
}

interface PlanOrganization {
  id: string;
  name: string;
  description: string;
  plansCount: number;
  plans: Plan[];
}

export function PlansOrganization({ plans, onSelectOrganization }: PlansOrganizationProps) {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  // Organizações fictícias para demonstração
  const organizations: PlanOrganization[] = [
    {
      id: "individual",
      name: "Planos Individuais",
      description: "Planos para treino individual e consultoria",
      plansCount: plans.filter(p => p.name.toLowerCase().includes('individual') || p.name.toLowerCase().includes('mensal')).length,
      plans: plans.filter(p => p.name.toLowerCase().includes('individual') || p.name.toLowerCase().includes('mensal'))
    },
    {
      id: "grupo",
      name: "Planos em Grupo",
      description: "Planos para aulas em grupo e turmas",
      plansCount: plans.filter(p => p.name.toLowerCase().includes('grupo') || p.name.toLowerCase().includes('turma')).length,
      plans: plans.filter(p => p.name.toLowerCase().includes('grupo') || p.name.toLowerCase().includes('turma'))
    },
    {
      id: "premium",
      name: "Planos Premium",
      description: "Planos diferenciados com benefícios exclusivos",
      plansCount: plans.filter(p => p.price > 200).length,
      plans: plans.filter(p => p.price > 200)
    },
    {
      id: "basicos",
      name: "Planos Básicos",
      description: "Planos de entrada com preços acessíveis",
      plansCount: plans.filter(p => p.price <= 200).length,
      plans: plans.filter(p => p.price <= 200)
    }
  ];

  const handleSelectOrganization = (orgId: string) => {
    setSelectedOrg(selectedOrg === orgId ? null : orgId);
    if (onSelectOrganization) {
      onSelectOrganization(orgId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Building2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Organização de Planos</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {organizations.map((org) => (
          <Card key={org.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader 
              className="pb-3"
              onClick={() => handleSelectOrganization(org.id)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {selectedOrg === org.id ? (
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Folder className="w-5 h-5 text-gray-600" />
                  )}
                  <span>{org.name}</span>
                </div>
                <Badge variant="secondary">
                  {org.plansCount} planos
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">{org.description}</p>
            </CardHeader>

            {selectedOrg === org.id && (
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-800 mb-3">
                    Planos desta organização:
                  </h4>
                  
                  {org.plans.length > 0 ? (
                    <div className="space-y-2">
                      {org.plans.map((plan) => (
                        <div 
                          key={plan.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{plan.name}</div>
                            <div className="text-sm text-gray-600">
                              R$ {plan.price.toFixed(2)} - {plan.duration} {plan.duration === 1 ? 'mês' : 'meses'}
                            </div>
                          </div>
                          <Badge variant={plan.active ? "default" : "secondary"}>
                            {plan.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">Nenhum plano encontrado nesta organização</p>
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
          <Button 
            variant="outline" 
            onClick={() => setSelectedOrg(null)}
          >
            Fechar Visualização
          </Button>
        </div>
      )}
    </div>
  );
}
