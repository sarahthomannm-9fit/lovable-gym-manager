
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";

interface TrainingData {
  id: string;
  studentName: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'valid' | 'expiring' | 'expired' | 'needs_review';
}

interface TrainingStatsProps {
  trainings: TrainingData[];
}

export function TrainingStats({ trainings }: TrainingStatsProps) {
  const today = new Date();
  
  const validTrainings = trainings.filter(t => {
    const endDate = new Date(t.endDate);
    return endDate > today;
  });

  const expiringTrainings = trainings.filter(t => {
    const endDate = new Date(t.endDate);
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 15 && diffDays > 0;
  });

  const expiredTrainings = trainings.filter(t => {
    const endDate = new Date(t.endDate);
    return endDate < today;
  });

  const needsReviewTrainings = trainings.filter(t => {
    const endDate = new Date(t.endDate);
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 15;
  });

  const stats = [
    {
      title: "Treinos Válidos",
      count: validTrainings.length,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      data: validTrainings
    },
    {
      title: "Próximos do Vencimento",
      count: expiringTrainings.length,
      subtitle: "(15 dias)",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      data: expiringTrainings
    },
    {
      title: "Treinos Vencidos",
      count: expiredTrainings.length,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      data: expiredTrainings
    },
    {
      title: "Precisam Revisão",
      count: needsReviewTrainings.length,
      icon: RefreshCw,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      data: needsReviewTrainings
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`${stat.bgColor} border-none`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="text-gray-700">{stat.title}</span>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color}`}>
                  {stat.count}
                </div>
                {stat.subtitle && (
                  <p className="text-xs text-gray-600 mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detalhamento por categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span>{stat.title}</span>
                <Badge variant="secondary">{stat.count}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stat.data.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stat.data.map((training) => (
                    <div 
                      key={training.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">{training.studentName}</div>
                        <div className="text-xs text-gray-600">{training.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          Término: {new Date(training.endDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum treino nesta categoria
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
