import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ArrowLeft, TrendingUp, Weight, Ruler, Calendar, MessageCircle, FileText } from "lucide-react";
import { Student } from "@/types/gym";

interface StudentProfileProps {
  student: Student;
  onBack: () => void;
}

export function StudentProfile({ student, onBack }: StudentProfileProps) {
  // Usar dados de performance do aluno ou dados padrão
  const performanceData = student.performanceData ? 
    student.performanceData.dates.map((date, index) => ({
      date,
      weight: student.performanceData!.weight[index],
      bodyFat: student.performanceData!.bodyFat[index],
      muscle: student.performanceData!.muscle[index]
    })) : [
      { date: "Jan", weight: 75.2, bodyFat: 18.5, muscle: 42.1 },
      { date: "Fev", weight: 74.8, bodyFat: 17.8, muscle: 42.8 },
      { date: "Mar", weight: 74.2, bodyFat: 17.2, muscle: 43.5 },
      { date: "Abr", weight: 73.8, bodyFat: 16.8, muscle: 44.1 },
      { date: "Mai", weight: 73.5, bodyFat: 16.2, muscle: 44.8 },
    ];

  const workoutData = student.performanceData?.workoutData || [
    { exercise: "Supino", weight: 80, reps: 12, sets: 3 },
    { exercise: "Agachamento", weight: 120, reps: 10, sets: 4 },
    { exercise: "Levantamento", weight: 100, reps: 8, sets: 3 },
    { exercise: "Desenvolvimento", weight: 60, reps: 12, sets: 3 },
  ];

  const frequency = student.performanceData?.frequency || 95;
  const currentWeight = performanceData[performanceData.length - 1]?.weight || 0;
  const currentBodyFat = performanceData[performanceData.length - 1]?.bodyFat || 0;
  const currentMuscle = performanceData[performanceData.length - 1]?.muscle || 0;
  
  const weightDiff = performanceData.length > 1 ? 
    (currentWeight - performanceData[0].weight).toFixed(1) : "0";
  const bodyFatDiff = performanceData.length > 1 ? 
    (currentBodyFat - performanceData[0].bodyFat).toFixed(1) : "0";
  const muscleDiff = performanceData.length > 1 ? 
    (currentMuscle - performanceData[0].muscle).toFixed(1) : "0";

  const frequencyData = [
    { month: "Jan", frequency: 85 },
    { month: "Fev", frequency: 92 },
    { month: "Mar", frequency: 78 },
    { month: "Abr", frequency: 88 },
    { month: "Mai", frequency: frequency },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            {student.name}
          </h1>
          <p className="text-muted-foreground">{student.email} • {student.plan}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="text-blue-600 border-blue-600">
            <MessageCircle className="w-4 h-4 mr-2" />
            Mensagem
          </Button>
          <Button variant="outline" className="text-green-600 border-green-600">
            <FileText className="w-4 h-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{student.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plano</p>
              <p className="font-medium">{student.plan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Início</p>
              <p className="font-medium">{student.startDate ? new Date(student.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
              <p className="font-medium">{student.paymentMethod || 'Não informado'}</p>
            </div>
            {student.emergencyContact && (
              <div>
                <p className="text-sm text-muted-foreground">Contato de Emergência</p>
                <p className="font-medium">{student.emergencyContact}</p>
              </div>
            )}
            {student.medicalInfo && (
              <div>
                <p className="text-sm text-muted-foreground">Informações Médicas</p>
                <p className="font-medium">{student.medicalInfo}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center">
              <Weight className="w-4 h-4 mr-2" />
              Peso Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{currentWeight} kg</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {parseFloat(weightDiff) >= 0 ? '+' : ''}{weightDiff}kg desde Jan
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              % Gordura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">{currentBodyFat}%</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {parseFloat(bodyFatDiff) >= 0 ? '+' : ''}{bodyFatDiff}% desde Jan
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center">
              <Ruler className="w-4 h-4 mr-2" />
              Massa Muscular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{currentMuscle} kg</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              {parseFloat(muscleDiff) >= 0 ? '+' : ''}{muscleDiff}kg desde Jan
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Frequência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{frequency}%</div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Este mês</p>
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
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={3} name="Peso (kg)" />
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
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="exercise" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'weight' ? `${value}kg` : value,
                    name === 'weight' ? 'Peso' : name === 'reps' ? 'Repetições' : 'Séries'
                  ]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} 
                />
                <Bar dataKey="weight" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis domain={[0, 100]} className="text-muted-foreground" />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Frequência']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} 
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