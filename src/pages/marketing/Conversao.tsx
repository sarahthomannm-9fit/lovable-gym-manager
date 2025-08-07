
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { TrendingUp, Target, Users, Clock, CheckCircle, Calendar } from "lucide-react";

export function Conversao() {
  return (
    <ResponsiveLayout 
      activeView="conversao" 
      onViewChange={() => {}} 
      title="Conversão de Clientes"
      subtitle="Estratégias para converter leads em alunos"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Otimização de Conversão</h2>
            <p className="text-muted-foreground">Aumente suas taxas de conversão com estratégias focadas</p>
          </div>
          <Button>
            <Target className="mr-2 h-4 w-4" />
            Nova Estratégia
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23.1%</div>
              <p className="text-xs text-muted-foreground">+2.4% este mês</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Qualificados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">67</div>
              <p className="text-xs text-muted-foreground">Prontos para conversão</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aulas Experimentais</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">Agendadas esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7.2d</div>
              <p className="text-xs text-muted-foreground">Lead → Cliente</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Estratégias de Conversão</CardTitle>
              <CardDescription>Táticas para aumentar suas vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Aula Experimental Gratuita</h4>
                    <p className="text-muted-foreground">Converta 65% dos participantes</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Desconto First Timer</h4>
                    <p className="text-muted-foreground">20% off no primeiro mês</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Programa Amigo Indica</h4>
                    <p className="text-muted-foreground">Desconto para ambos</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Follow-up Personalizado</h4>
                    <p className="text-muted-foreground">Contato em 24h</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Oportunidades de Melhoria</CardTitle>
              <CardDescription>Áreas para otimizar suas conversões</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">Reduzir Tempo de Resposta</h4>
                  <p className="text-muted-foreground">Atualmente: 4.2h | Meta: 2h</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">Aumentar Show Rate</h4>
                  <p className="text-muted-foreground">Atualmente: 72% | Meta: 85%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold">Melhorar Follow-up</h4>
                  <p className="text-muted-foreground">Atualmente: 3 tentativas | Meta: 5</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>

                <Button className="w-full">Implementar Melhorias</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
