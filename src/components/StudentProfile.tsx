
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ArrowLeft, TrendingUp, Weight, Ruler, Calendar } from "lucide-react";

interface StudentProfileProps {
  student: {
    id: number;
    name: string;
    email: string;
    phone: string;
    plan: string;
    status: string;
  };
  onBack: () => void;
}

export function StudentProfile({ student, onBack }: StudentProfileProps) {
  // Dados simulados de evolução do aluno
  const performanceData = [
    { date: "Jan", weight: 75.2, bodyFat: 18.5, muscle: 42.1 },
    { date: "Fev", weight: 74.8, bodyFat: 17.8, muscle: 42.8 },
    { date: "Mar", weight: 74.2, bodyFat: 17.2, muscle: 43.5 },
    { date: "Abr", weight: 73.8, bodyFat: 16.8, muscle: 44.1 },
    { date: "Mai", weight: 73.5, bodyFat: 16.2, muscle: 44.8 },
  ];

  const workoutData = [
    { exercise: "Supino", weight: 80, reps: 12 },
    { exercise: "Agachamento", weight: 120, reps: 10 },
    { exercise: "Levantamento", weight: 100, reps: 8 },
    { exercise: "Desenvolvimento", weight: 60, reps: 12 },
  ];

  const frequencyData = [
    { month: "Jan", frequency: 85 },
    { month: "Fev", frequency: 92 },
    { month: "Mar", frequency: 78 },
    { month: "Abr", frequency: 88 },
    { month: "Mai", frequency: 95 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            {student.name}
          </h1>
          <p className="text-gray-600">{student.email} • {student.plan}</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <Weight className="w-4 h-4 mr-2" />
              Peso Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">73.5 kg</div>
            <p className="text-xs text-blue-600 mt-1">-1.7kg desde Jan</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              % Gordura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">16.2%</div>
            <p className="text-xs text-green-600 mt-1">-2.3% desde Jan</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <Ruler className="w-4 h-4 mr-2" />
              Massa Muscular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">44.8 kg</div>
            <p className="text-xs text-purple-600 mt-1">+2.7kg desde Jan</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Frequência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">95%</div>
            <p className="text-xs text-yellow-600 mt-1">Maio 2024</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Física */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Física</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={3} name="Peso (kg)" />
                <Line type="monotone" dataKey="bodyFat" stroke="#EF4444" strokeWidth={3} name="% Gordura" />
                <Line type="monotone" dataKey="muscle" stroke="#10B981" strokeWidth={3} name="Massa Muscular (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cargas de Treino */}
        <Card>
          <CardHeader>
            <CardTitle>Cargas Atuais</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workoutData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="exercise" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="weight" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Frequência Mensal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Frequência Mensal (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={frequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis domain={[0, 100]} stroke="#666" />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Frequência']}
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} 
                />
                <Bar dataKey="frequency" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
