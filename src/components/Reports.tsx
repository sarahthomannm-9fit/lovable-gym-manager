import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Cell,
  AreaChart,
  Area
} from "recharts";
import { FileText, Download, TrendingUp, Users, DollarSign, BarChart3, PieChart as PieChartIcon, Activity, CreditCard, AlertCircle, Target } from "lucide-react";

export function Reports() {
  const [activeSection, setActiveSection] = useState("financial");

  // Dados simulados expandidos para relatórios mais avançados
  const monthlyRevenue = [
    { month: "Ago", revenue: 7800, expenses: 3200, profit: 4600, students: 42 },
    { month: "Set", revenue: 8500, expenses: 3400, profit: 5100, students: 45 },
    { month: "Out", revenue: 9200, expenses: 3600, profit: 5600, students: 47 },
    { month: "Nov", revenue: 10800, expenses: 4200, profit: 6600, students: 52 },
    { month: "Dez", revenue: 12450, expenses: 4800, profit: 7650, students: 58 },
    { month: "Jan", revenue: 11900, expenses: 4500, profit: 7400, students: 56 },
  ];

  const paymentMethods = [
    { name: "PIX", value: 45, amount: 5610, color: "#10B981" },
    { name: "Cartão", value: 35, amount: 4365, color: "#3B82F6" },
    { name: "Dinheiro", value: 15, amount: 1785, color: "#F59E0B" },
    { name: "Transferência", value: 5, amount: 595, color: "#8B5CF6" },
  ];

  const studentRetention = [
    { month: "Ago", retention: 92, churn: 8, newStudents: 5 },
    { month: "Set", retention: 88, churn: 12, newStudents: 8 },
    { month: "Out", retention: 95, churn: 5, newStudents: 7 },
    { month: "Nov", retention: 91, churn: 9, newStudents: 12 },
    { month: "Dez", retention: 89, churn: 11, newStudents: 15 },
    { month: "Jan", retention: 93, churn: 7, newStudents: 3 },
  ];

  const overduePayments = [
    { student: "Carlos Oliveira", amount: 280, daysOverdue: 5, plan: "Mensal" },
    { student: "Fernanda Lima", amount: 840, daysOverdue: 12, plan: "Trimestral" },
    { student: "Ricardo Santos", amount: 280, daysOverdue: 3, plan: "Mensal" },
  ];

  const revenueProjection = [
    { month: "Fev", projected: 12800, conservative: 11200, optimistic: 14400 },
    { month: "Mar", projected: 13500, conservative: 12100, optimistic: 15200 },
    { month: "Abr", projected: 14200, conservative: 12800, optimistic: 16100 },
    { month: "Mai", projected: 15000, conservative: 13500, optimistic: 17200 },
    { month: "Jun", projected: 15800, conservative: 14200, optimistic: 18100 },
  ];

  const profitabilityAnalysis = {
    averageLTV: 2840, // Lifetime Value médio
    acquisitionCost: 150, // Custo de aquisição por aluno
    monthlyChurn: 8.5, // Taxa de churn mensal
    profitMargin: 62, // Margem de lucro %
  };

  const sections = [
    { id: "financial", name: "Financeiro", icon: DollarSign },
    { id: "students", name: "Alunos", icon: Users },
    { id: "classes", name: "Aulas", icon: BarChart3 },
    { id: "performance", name: "Performance", icon: Activity },
    { id: "advanced", name: "Análises", icon: Target },
  ];

  const renderFinancialSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Faturamento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">R$ 12.450</div>
            <p className="text-xs text-green-600 mt-1">+18% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">R$ 7.650</div>
            <p className="text-xs text-blue-600 mt-1">Margem: 61.4%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Inadimplência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">R$ 1.400</div>
            <p className="text-xs text-purple-600 mt-1">3 alunos em atraso</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">R$ 222</div>
            <p className="text-xs text-yellow-600 mt-1">Por aluno/mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Financeiros */}
      {overduePayments.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              Pagamentos em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overduePayments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <span className="font-medium">{payment.student}</span>
                    <p className="text-sm text-gray-600">{payment.plan} - {payment.daysOverdue} dias</p>
                  </div>
                  <span className="font-bold text-red-600">R$ {payment.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  formatter={(value, name) => [
                    `R$ ${value}`, 
                    name === 'revenue' ? 'Receita' : 
                    name === 'expenses' ? 'Gastos' : 'Lucro'
                  ]}
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                <Area type="monotone" dataKey="profit" stackId="3" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formas de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value}%`, `R$ ${props.payload.amount}`]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAdvancedSection = () => (
    <div className="space-y-6">
      {/* Métricas de Rentabilidade */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              LTV Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">R$ {profitabilityAnalysis.averageLTV}</div>
            <p className="text-xs text-green-600 mt-1">Lifetime Value</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              CAC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">R$ {profitabilityAnalysis.acquisitionCost}</div>
            <p className="text-xs text-blue-600 mt-1">Custo aquisição</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Taxa de Churn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{profitabilityAnalysis.monthlyChurn}%</div>
            <p className="text-xs text-purple-600 mt-1">Mensal</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Margem de Lucro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">{profitabilityAnalysis.profitMargin}%</div>
            <p className="text-xs text-yellow-600 mt-1">Média mensal</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projeção de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueProjection}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  formatter={(value) => [`R$ ${value}`, 'Valor']}
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                />
                <Line type="monotone" dataKey="conservative" stroke="#EF4444" strokeWidth={2} name="Conservador" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="projected" stroke="#3B82F6" strokeWidth={3} name="Projetado" />
                <Line type="monotone" dataKey="optimistic" stroke="#10B981" strokeWidth={2} name="Otimista" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retenção vs Churn</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentRetention}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}${name === 'newStudents' ? ' alunos' : '%'}`, 
                    name === 'retention' ? 'Retenção' : 
                    name === 'churn' ? 'Churn' : 'Novos Alunos'
                  ]}
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="retention" fill="#10B981" name="Retenção %" />
                <Bar dataKey="churn" fill="#EF4444" name="Churn %" />
                <Bar dataKey="newStudents" fill="#3B82F6" name="Novos Alunos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análise ROI */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de ROI por Canal de Aquisição</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Indicação</h4>
              <div className="text-2xl font-bold text-green-700">350%</div>
              <p className="text-sm text-green-600">ROI mais alto</p>
              <p className="text-xs text-gray-600 mt-1">Custo: R$ 50 | LTV: R$ 2.250</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Redes Sociais</h4>
              <div className="text-2xl font-bold text-blue-700">280%</div>
              <p className="text-sm text-blue-600">Bom retorno</p>
              <p className="text-xs text-gray-600 mt-1">Custo: R$ 180 | LTV: R$ 2.840</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Publicidade</h4>
              <div className="text-2xl font-bold text-yellow-700">190%</div>
              <p className="text-sm text-yellow-600">Moderado</p>
              <p className="text-xs text-gray-600 mt-1">Custo: R$ 320 | LTV: R$ 2.840</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStudentsSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total de Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">47</div>
            <p className="text-xs text-blue-600 mt-1">+12% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Taxa de Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">94%</div>
            <p className="text-xs text-green-600 mt-1">+3% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Frequência Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">87%</div>
            <p className="text-xs text-purple-600 mt-1">+5% vs mês anterior</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderClassesSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Aulas Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">156</div>
            <p className="text-xs text-yellow-600 mt-1">+8% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Taxa de Comparecimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">91%</div>
            <p className="text-xs text-green-600 mt-1">+2% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Cancelamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">9%</div>
            <p className="text-xs text-blue-600 mt-1">-1% vs mês anterior</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPerformanceSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Satisfação Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">4.6/5</div>
            <p className="text-xs text-green-600 mt-1">+0.2 vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Progresso Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">+3.2kg</div>
            <p className="text-xs text-blue-600 mt-1">Ganho muscular</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Redução de Gordura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">-2.1%</div>
            <p className="text-xs text-purple-600 mt-1">Média dos alunos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "financial":
        return renderFinancialSection();
      case "students":
        return renderStudentsSection();
      case "classes":
        return renderClassesSection();
      case "performance":
        return renderPerformanceSection();
      case "advanced":
        return renderAdvancedSection();
      default:
        return renderFinancialSection();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Relatórios e Analytics
          </h1>
          <p className="text-gray-600 mt-1">Análise completa por seções</p>
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

      {/* Navegação por seções */}
      <div className="flex space-x-2 border-b">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "default" : "ghost"}
            onClick={() => setActiveSection(section.id)}
            className="flex items-center space-x-2"
          >
            <section.icon className="w-4 h-4" />
            <span>{section.name}</span>
          </Button>
        ))}
      </div>

      {/* Conteúdo da seção ativa */}
      {renderSection()}
    </div>
  );
}
