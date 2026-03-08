
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Users } from "lucide-react";
import { SupabasePlan } from "@/hooks/useSupabasePlans";

type PlanType = SupabasePlan;

interface PlanCardProps {
  plan: SupabasePlan;
  studentsCount: number;
  onToggleStatus: (planId: string) => void;
}

export function PlanCard({ plan, studentsCount, onToggleStatus }: PlanCardProps) {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
  const colorIndex = plan.id.charCodeAt(plan.id.length - 1) % colors.length;
  const planColor = colors[colorIndex];
  
  const isActive = plan.ativo ?? true;
  const durationLabel = plan.duracao_meses 
    ? (plan.duracao_meses === 1 ? 'mês' : `${plan.duracao_meses} meses`)
    : plan.duracao_dias 
      ? `${plan.duracao_dias} dias`
      : 'mês';

  return (
    <Card className={`relative overflow-hidden ${!isActive ? 'opacity-60' : ''}`}>
      <div className={`h-2 ${planColor}`} />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{plan.nome}</CardTitle>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-primary">R$ {Number(plan.preco).toFixed(2)}</span>
            <span className="text-muted-foreground ml-1">/{durationLabel}</span>
          </div>
          {plan.tipo && (
            <Badge variant="outline" className="text-xs capitalize">{plan.tipo}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {plan.beneficios && plan.beneficios.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Benefícios:</h4>
            <ul className="space-y-1">
              {plan.beneficios.map((benefit, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {plan.quantidade_aulas != null && plan.quantidade_aulas > 0 && (
          <div className="text-sm text-muted-foreground">
            {plan.quantidade_aulas} aulas incluídas
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-1" />
            {studentsCount} alunos
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(plan.id)}
            >
              {isActive ? "Desativar" : "Ativar"}
            </Button>
            
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
