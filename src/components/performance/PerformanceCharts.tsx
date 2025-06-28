
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts";

interface PerformanceChartsProps {
  radarData: any[];
  comparisonData: any[];
  evolutionData: { [key: string]: any[] };
}

export function PerformanceCharts({ radarData, comparisonData, evolutionData }: PerformanceChartsProps) {
  return (
    <div className="space-y-6">
      {/* Gráfico Radar de Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Multidimensional dos Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="student" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Performance"
                dataKey="metas"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Comparação de Progresso */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Progresso entre Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="student" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="weightProgress" fill="#3B82F6" name="Peso (kg)" />
              <Bar dataKey="bodyFatProgress" fill="#10B981" name="Gordura (%)" />
              <Bar dataKey="muscleMassProgress" fill="#F59E0B" name="Músculo (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Evolução Individual */}
      {Object.entries(evolutionData).map(([student, data]) => {
        if (data.length < 2) return null;
        
        return (
          <Card key={student}>
            <CardHeader>
              <CardTitle>Evolução - {student}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                  <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={3} name="Peso (kg)" />
                  <Line type="monotone" dataKey="bodyFat" stroke="#EF4444" strokeWidth={3} name="% Gordura" />
                  <Line type="monotone" dataKey="muscleMass" stroke="#10B981" strokeWidth={3} name="Massa Muscular (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
