import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dumbbell, Activity, Bot, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PainelAluno() {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Meus Treinos',
      description: 'Veja seus treinos ativos e histórico',
      icon: Dumbbell,
      color: 'text-blue-600',
      action: () => navigate('/treinos'),
    },
    {
      title: 'Avaliações Físicas',
      description: 'Acompanhe sua evolução corporal',
      icon: Activity,
      color: 'text-green-600',
      action: () => navigate('/avaliacoes'),
    },
    {
      title: 'Agente IA',
      description: 'Solicite treinos e tire dúvidas com IA',
      icon: Bot,
      color: 'text-purple-600',
      action: () => navigate('/agente-ia'),
    },
    {
      title: 'Minhas Aulas',
      description: 'Veja aulas agendadas e horários',
      icon: Calendar,
      color: 'text-orange-600',
      action: () => navigate('/aulas'),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Painel</h1>
        <p className="text-muted-foreground">Bem-vindo! Acesse seus recursos abaixo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]" onClick={card.action}>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-xl bg-muted ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">Acessar →</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
