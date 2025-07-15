
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, CreditCard, BarChart3 } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  // Redirecionar automaticamente para o painel
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/painel');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              FitManage Pro
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sistema completo de gestão para academias. Gerencie alunos, planos, treinos e muito mais.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/alunos')}>
              <CardHeader className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <CardTitle className="text-lg">Alunos</CardTitle>
                <CardDescription>Gerencie cadastros e informações</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/planos')}>
              <CardHeader className="text-center">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <CardTitle className="text-lg">Planos</CardTitle>
                <CardDescription>Configure mensalidades e pacotes</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/aulas')}>
              <CardHeader className="text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <CardTitle className="text-lg">Aulas</CardTitle>
                <CardDescription>Organize horários e atividades</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/relatorios')}>
              <CardHeader className="text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <CardTitle className="text-lg">Relatórios</CardTitle>
                <CardDescription>Análises financeiras e insights</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-4">
            <Button size="lg" onClick={() => navigate('/painel')} className="text-lg px-8">
              Acessar Sistema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground">
              Redirecionamento automático em 3 segundos...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
