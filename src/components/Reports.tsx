
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { FileText, Download, TrendingUp, Users, DollarSign } from "lucide-react";

export function Reports() {
  // Dados simulados para os gráficos
  const monthlyRevenue = [
    { month: "Set", revenue: 8500 },
    { month: "Out", revenue: 9200 },
    { month: "Nov", revenue: 10800 },
    { month: "Dez", revenue: 12450 },
    { month: "Jan", revenue: 11900 },
  ];

  const studentFrequency = [
    { name: "João Silva", frequency: 85 },
    { name: "Maria Santos", frequency: 92 },
    { name: "Pedro Costa", frequency: 78 },
    { name: "Ana Paula", frequency: 88 },
    { name: "Carlos Oliveira", frequency: 95 },
  ];

  const classTypes = [
    { name: "Musculação", value: 45, color: "#3B82F6" },
    { name: "Funcional", value: 30, color: "#10B981" },
    { name: "HIIT", value: 15, color: "#F59E0B" },
    { name: "Cardio", value: 10, color: "#EF4444" },
  ];

  const performanceData = [
    { month: "Set", avgWeight: 72.5, avgBodyFat: 18.2 },
    { month: "Out", avgWeight: 73.1, avgBodyFat: 17.8 },
    { month: "Nov", avgWeight: 73.8, avgBodyFat: 17.4 },
    { month: "Dez", avgWeight: 74.2, avgBodyFat: 17.0 },
    { month: "Jan", avgWeight: 74.6, avgBodyFat: 16.8 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Relatórios e Analytics
          </h1>
          <p className="text-gray-600 mt-1">Análise completa do seu negócio</p>
        </div>
        
        <div className="flex space-x-3">
          <Select defaultValue="last-month">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-week">Última Semana</SelectItem>
              <SelectItem value="last-month">Último Mês</SelectItem>
              <SelectItem value="last-quarter">Último Trimestre</SelectItem>
              <SelectItem value="last-year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Faturamento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">R$ 12.450</div>
            <p className="text-xs text-blue-600 mt-1">+18% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Taxa de Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">94%</div>
            <p className="text-xs text-green-600 mt-1">+3% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Frequência Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">87%</div>
            <p className="text-xs text-purple-600 mt-1">+5% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Satisfação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">4.6/5</div>
            <p className="text-xs text-yellow-600 mt-1">+0.2 vs mês anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faturamento Mensal */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Evolução do Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  formatter={(value) => [`R$ ${value}`, 'Faturamento']}
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="revenue" fill="url(#gradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Frequência dos Alunos */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Frequência por Aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentFrequency} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} stroke="#666" />
                <YAxis dataKey="name" type="category" width={100} stroke="#666" />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Frequência']}
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="frequency" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Tipo de Aula */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribuição por Tipo de Aula</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={classTypes}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {classTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentual']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução Física Média */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Evolução Física Média dos Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgWeight" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  name="Peso Médio (kg)"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgBodyFat" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  name="% Gordura Média"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <span>Relatório Mensal</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Download className="w-6 h-6 text-green-600" />
              <span>Exportar Dados</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <span>Análise Detalhada</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
