
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Users } from "lucide-react";
import { Plan } from "@/types/gym";

interface PlanCardProps {
  plan: Plan;
  studentsCount: number;
  onToggleStatus: (planId: number) => void;
}

export function PlanCard({ plan, studentsCount, onToggleStatus }: PlanCardProps) {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
  const planColor = colors[plan.id % colors.length];
  
  return (
    <Card className={`relative overflow-hidden ${!plan.active ? 'opacity-60' : ''}`}>
      <div className={`h-2 ${planColor}`} />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          <Badge variant={plan.active ? "default" : "secondary"}>
            {plan.active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-primary">R$ {plan.price.toFixed(2)}</span>
            <span className="text-gray-500 ml-1">/{plan.duration === 1 ? 'mês' : `${plan.duration} meses`}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-2">Benefícios:</h4>
          <ul className="space-y-1">
            {plan.benefits.map((benefit, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            {studentsCount} alunos
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(plan.id)}
            >
              {plan.active ? "Desativar" : "Ativar"}
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
