import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SupabaseGymDataProvider } from "@/contexts/SupabaseGymDataContext";
import { DataIntegrationProvider } from "@/components/DataIntegrationProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

import NotFound from "./pages/NotFound";
import { Painel } from "./pages/Painel";
import { Treinos } from "./pages/Treinos";
import { Relatorios } from "./pages/Relatorios";
import { FluxoPagamentos } from "./pages/relatorios/FluxoPagamentos";
import { FluxoRecebimentos } from "./pages/relatorios/FluxoRecebimentos";
import { Cobrancas } from "./pages/relatorios/Cobrancas";
import { EstrategiasIA } from "./pages/relatorios/EstrategiasIA";
import { PromocoesCupons } from "./pages/relatorios/PromocoesCupons";
import { SupabaseStudents } from "./components/SupabaseStudents";
import { SupabasePlans } from "./components/SupabasePlans";
import { SupabaseClasses } from "./components/SupabaseClasses";
import { SupabasePayments } from "./components/SupabasePayments";
import { SupabaseCheckIn } from "./components/SupabaseCheckIn";
import { Equipment } from "./components/Equipment";
import { Campanhas } from "./pages/marketing/Campanhas";
import { Captacao } from "./pages/marketing/Captacao";
import { Comunicacao } from "./pages/marketing/Comunicacao";
import { Conversao } from "./pages/marketing/Conversao";
import { Funis } from "./pages/marketing/Funis";
import { EmailMarketing } from "./pages/marketing/EmailMarketing";
import { Promocoes } from "./pages/marketing/Promocoes";
import { InsightsIA } from "./pages/marketing/InsightsIA";
import { Produtos } from "./pages/Produtos";
import { Catalogo } from "./pages/Catalogo";
import { Automacao } from "./pages/marketing/Automacao";
import { AgenteIA } from "./pages/AgenteIA";
import Dashboard9FIT from "./pages/9fit/Dashboard9FIT";
import CEODashboard from "./pages/9fit/CEODashboard";
import ConsultoriaDashboard from "./pages/9fit/ConsultoriaDashboard";
import ConciergeDashboard from "./pages/9fit/ConciergeDashboard";
import TrustDashboard from "./pages/9fit/TrustDashboard";
import NetworkDashboard from "./pages/9fit/NetworkDashboard";
import AutomationDashboard from "./pages/9fit/AutomationDashboard";
import StoreDashboard from "./pages/9fit/StoreDashboard";
import { DemoModeProvider } from "./contexts/DemoModeContext";
import { Funcionarios } from "./pages/Funcionarios";
import { AvaliacoesFisicas } from "./pages/AvaliacoesFisicas";
import { AulasExperimentais } from "./pages/AulasExperimentais";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  </SidebarProvider>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SupabaseGymDataProvider>
        <DataIntegrationProvider>
          <DemoModeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/painel" replace />} />
                  <Route path="/painel" element={<MainLayout><Painel /></MainLayout>} />
                  <Route path="/alunos" element={<MainLayout><SupabaseStudents /></MainLayout>} />
                  <Route path="/planos" element={<MainLayout><SupabasePlans /></MainLayout>} />
                  <Route path="/aulas" element={<MainLayout><SupabaseClasses /></MainLayout>} />
                  <Route path="/pagamentos" element={<MainLayout><SupabasePayments /></MainLayout>} />
                  <Route path="/checkin" element={<MainLayout><SupabaseCheckIn /></MainLayout>} />
                  <Route path="/equipamentos" element={<MainLayout><Equipment /></MainLayout>} />
                  <Route path="/treinos" element={<MainLayout><Treinos /></MainLayout>} />
                  <Route path="/relatorios" element={<MainLayout><Relatorios /></MainLayout>} />
                  <Route path="/relatorios/pagamentos" element={<MainLayout><FluxoPagamentos /></MainLayout>} />
                  <Route path="/relatorios/recebimentos" element={<MainLayout><FluxoRecebimentos /></MainLayout>} />
                  <Route path="/relatorios/cobrancas" element={<MainLayout><Cobrancas /></MainLayout>} />
                  <Route path="/relatorios/estrategias" element={<MainLayout><EstrategiasIA /></MainLayout>} />
                  <Route path="/relatorios/promocoes-cupons" element={<MainLayout><PromocoesCupons /></MainLayout>} />
                  <Route path="/marketing/campanhas" element={<MainLayout><Campanhas /></MainLayout>} />
                  <Route path="/marketing/captacao" element={<MainLayout><Captacao /></MainLayout>} />
                  <Route path="/marketing/comunicacao" element={<MainLayout><Comunicacao /></MainLayout>} />
                  <Route path="/marketing/conversao" element={<MainLayout><Conversao /></MainLayout>} />
                  <Route path="/marketing/funis" element={<MainLayout><Funis /></MainLayout>} />
                  <Route path="/marketing/email" element={<MainLayout><EmailMarketing /></MainLayout>} />
                  <Route path="/marketing/promocoes" element={<MainLayout><Promocoes /></MainLayout>} />
                  <Route path="/marketing/insights-ia" element={<MainLayout><InsightsIA /></MainLayout>} />
                  <Route path="/marketing/automacao" element={<MainLayout><Automacao /></MainLayout>} />
                  <Route path="/agente-ia" element={<MainLayout><AgenteIA /></MainLayout>} />
                  <Route path="/catalogo" element={<MainLayout><Catalogo /></MainLayout>} />
                  <Route path="/produtos" element={<MainLayout><Produtos /></MainLayout>} />
                  <Route path="/9fit" element={<MainLayout><Dashboard9FIT /></MainLayout>} />
                  <Route path="/9fit/ceo" element={<MainLayout><CEODashboard /></MainLayout>} />
                  <Route path="/9fit/consultoria" element={<MainLayout><ConsultoriaDashboard /></MainLayout>} />
                  <Route path="/9fit/concierge" element={<MainLayout><ConciergeDashboard /></MainLayout>} />
                  <Route path="/9fit/trust" element={<MainLayout><TrustDashboard /></MainLayout>} />
                  <Route path="/9fit/network" element={<MainLayout><NetworkDashboard /></MainLayout>} />
                  <Route path="/9fit/automation" element={<MainLayout><AutomationDashboard /></MainLayout>} />
                  <Route path="/9fit/store" element={<MainLayout><StoreDashboard /></MainLayout>} />
                  <Route path="/funcionarios" element={<MainLayout><Funcionarios /></MainLayout>} />
                  <Route path="/avaliacoes" element={<MainLayout><AvaliacoesFisicas /></MainLayout>} />
                  <Route path="/experimentais" element={<MainLayout><AulasExperimentais /></MainLayout>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </DemoModeProvider>
        </DataIntegrationProvider>
      </SupabaseGymDataProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
