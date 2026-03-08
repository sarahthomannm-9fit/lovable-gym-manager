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
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import { Login } from "./pages/Login";

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

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <MainLayout>{children}</MainLayout>
  </ProtectedRoute>
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
                  <Route path="/login" element={<Login />} />
                  <Route path="/painel" element={<ProtectedPage><Painel /></ProtectedPage>} />
                  <Route path="/alunos" element={<ProtectedPage><SupabaseStudents /></ProtectedPage>} />
                  <Route path="/planos" element={<ProtectedPage><SupabasePlans /></ProtectedPage>} />
                  <Route path="/aulas" element={<ProtectedPage><SupabaseClasses /></ProtectedPage>} />
                  <Route path="/pagamentos" element={<ProtectedPage><SupabasePayments /></ProtectedPage>} />
                  <Route path="/checkin" element={<ProtectedPage><SupabaseCheckIn /></ProtectedPage>} />
                  <Route path="/equipamentos" element={<ProtectedPage><Equipment /></ProtectedPage>} />
                  <Route path="/treinos" element={<ProtectedPage><Treinos /></ProtectedPage>} />
                  <Route path="/relatorios" element={<ProtectedPage><Relatorios /></ProtectedPage>} />
                  <Route path="/relatorios/pagamentos" element={<ProtectedPage><FluxoPagamentos /></ProtectedPage>} />
                  <Route path="/relatorios/recebimentos" element={<ProtectedPage><FluxoRecebimentos /></ProtectedPage>} />
                  <Route path="/relatorios/cobrancas" element={<ProtectedPage><Cobrancas /></ProtectedPage>} />
                  <Route path="/relatorios/estrategias" element={<ProtectedPage><EstrategiasIA /></ProtectedPage>} />
                  <Route path="/relatorios/promocoes-cupons" element={<ProtectedPage><PromocoesCupons /></ProtectedPage>} />
                  <Route path="/marketing/campanhas" element={<ProtectedPage><Campanhas /></ProtectedPage>} />
                  <Route path="/marketing/captacao" element={<ProtectedPage><Captacao /></ProtectedPage>} />
                  <Route path="/marketing/comunicacao" element={<ProtectedPage><Comunicacao /></ProtectedPage>} />
                  <Route path="/marketing/conversao" element={<ProtectedPage><Conversao /></ProtectedPage>} />
                  <Route path="/marketing/funis" element={<ProtectedPage><Funis /></ProtectedPage>} />
                  <Route path="/marketing/email" element={<ProtectedPage><EmailMarketing /></ProtectedPage>} />
                  <Route path="/marketing/promocoes" element={<ProtectedPage><Promocoes /></ProtectedPage>} />
                  <Route path="/marketing/insights-ia" element={<ProtectedPage><InsightsIA /></ProtectedPage>} />
                  <Route path="/marketing/automacao" element={<ProtectedPage><Automacao /></ProtectedPage>} />
                  <Route path="/agente-ia" element={<ProtectedPage><AgenteIA /></ProtectedPage>} />
                  <Route path="/produtos" element={<ProtectedPage><Produtos /></ProtectedPage>} />
                  <Route path="/9fit" element={<ProtectedPage><Dashboard9FIT /></ProtectedPage>} />
                  <Route path="/9fit/ceo" element={<ProtectedPage><CEODashboard /></ProtectedPage>} />
                  <Route path="/9fit/consultoria" element={<ProtectedPage><ConsultoriaDashboard /></ProtectedPage>} />
                  <Route path="/9fit/concierge" element={<ProtectedPage><ConciergeDashboard /></ProtectedPage>} />
                  <Route path="/9fit/trust" element={<ProtectedPage><TrustDashboard /></ProtectedPage>} />
                  <Route path="/9fit/network" element={<ProtectedPage><NetworkDashboard /></ProtectedPage>} />
                  <Route path="/9fit/automation" element={<ProtectedPage><AutomationDashboard /></ProtectedPage>} />
                  <Route path="/9fit/store" element={<ProtectedPage><StoreDashboard /></ProtectedPage>} />
                  <Route path="/funcionarios" element={<ProtectedPage><Funcionarios /></ProtectedPage>} />
                  <Route path="/avaliacoes" element={<ProtectedPage><AvaliacoesFisicas /></ProtectedPage>} />
                  <Route path="/experimentais" element={<ProtectedPage><AulasExperimentais /></ProtectedPage>} />
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
