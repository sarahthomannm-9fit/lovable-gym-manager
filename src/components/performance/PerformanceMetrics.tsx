
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Weight, TrendingUp, Target, Award } from "lucide-react";

interface PerformanceMetricsProps {
  totalRecords: number;
  averageProgress: string;
  goalSuccessRate: number;
  bestPerformer: string;
}

export function PerformanceMetrics({ 
  totalRecords, 
  averageProgress, 
  goalSuccessRate, 
  bestPerformer 
}: PerformanceMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
            <Weight className="w-4 h-4 mr-2" />
            Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-800">{totalRecords}</div>
          <p className="text-xs text-blue-600 mt-1">Total realizadas</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-green-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-700 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Média Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-800">{averageProgress}</div>
          <p className="text-xs text-green-600 mt-1">Massa muscular</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Metas Atingidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-800">{goalSuccessRate}%</div>
          <p className="text-xs text-purple-600 mt-1">Taxa de sucesso</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-yellow-700 flex items-center">
            <Award className="w-4 h-4 mr-2" />
            Melhor Resultado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-800">{bestPerformer}</div>
          <p className="text-xs text-yellow-600 mt-1">-2.3% gordura</p>
        </CardContent>
      </Card>
    </div>
  );
}
