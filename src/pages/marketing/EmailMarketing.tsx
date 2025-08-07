
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { Mail, Send, Users, TrendingUp, Eye, MousePointer } from "lucide-react";

export function EmailMarketing() {
  return (
    <ResponsiveLayout 
      activeView="email-marketing" 
      onViewChange={() => {}} 
      title="E-mail Marketing"
      subtitle="Campanhas de e-mail para engajamento e conversão"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">E-mail Marketing</h2>
            <p className="text-muted-foreground">Crie e gerencie campanhas de e-mail eficazes</p>
          </div>
          <Button>
            <Mail className="mr-2 h-4 w-4" />
            Nova Campanha
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.8%</div>
              <p className="text-xs text-muted-foreground">Média da indústria: 21%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Cliques</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2%</div>
              <p className="text-xs text-muted-foreground">Média da indústria: 2.6%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2K</div>
              <p className="text-xs text-muted-foreground">+15 esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">420%</div>
              <p className="text-xs text-muted-foreground">Retorno sobre investimento</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Campanhas Recentes</CardTitle>
              <CardDescription>Últimas campanhas enviadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Newsletter Janeiro</h4>
                    <p className="text-muted-foreground">Enviado para 1.2K assinantes</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">28.5% aberto</p>
                    <p className="text-xs text-muted-foreground">4.1% clicou</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Promoção Ano Novo</h4>
                    <p className="text-muted-foreground">Enviado para 950 prospects</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">31.2% aberto</p>
                    <p className="text-xs text-muted-foreground">5.8% clicou</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Dicas de Treino</h4>
                    <p className="text-muted-foreground">Enviado para 800 alunos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">22.7% aberto</p>
                    <p className="text-xs text-muted-foreground">2.9% clicou</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segmentos de Audiência</CardTitle>
              <CardDescription>Organize seus contatos por grupos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Alunos Ativos</h4>
                    <p className="text-muted-foreground">Matriculados e frequentando</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">342</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Ex-alunos</h4>
                    <p className="text-muted-foreground">Para campanhas de reativação</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">156</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Prospects Qualificados</h4>
                    <p className="text-muted-foreground">Interessados em se matricular</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">89</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Leads Frios</h4>
                    <p className="text-muted-foreground">Para nurturing</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">203</p>
                  </div>
                </div>

                <Button className="w-full">Gerenciar Segmentos</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
