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
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OperationalContextProvider } from "@/hooks/useOperationalContext";
import { RoleRoute } from "@/components/RoleRoute";
import SelectContext from "./pages/SelectContext";
import SindicoHome from "./pages/sindico/SindicoHome";
import CoachHome from "./pages/coach/CoachHome";
import CorpHome from "./pages/corp/CorpHome";
import OrganizationsAdmin from "./pages/admin/OrganizationsAdmin";
import MoradorHome from "./pages/morador/MoradorHome";
import HealthDayCheckin from "./pages/morador/HealthDayCheckin";
import FitProIntegration from "./pages/admin/FitProIntegration";
import Operacao9FIT from "./pages/admin/Operacao9FIT";
import LeadsExtractionPlan from "./pages/cfo/LeadsExtractionPlan";
import PipelineComercial from "./pages/comercial/PipelineComercial";
import Clientes from "./pages/comercial/Clientes";
import Contratos from "./pages/comercial/Contratos";
import PlanosTreino from "./pages/treinos/PlanosTreino";
import StudioHome from "./pages/studio/StudioHome";
import InsightsMercado from "./pages/insights/InsightsMercado";

import NotFound from "./pages/NotFound";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { UsersAdmin } from "./pages/UsersAdmin";
import ResetDemoData from "./pages/admin/ResetDemoData";
import AgentsHub from "./pages/AgentsHub";
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
import { Anamnese } from "./pages/Anamnese";
import { Inadimplencia } from "./pages/painel/Inadimplencia";
import { Retencao } from "./pages/painel/Retencao";
import { AgendaSemanal } from "./pages/painel/AgendaSemanal";
import { Pipeline } from "./pages/painel/Pipeline";
import { ContextSwitcher } from "./components/ContextSwitcher";
import Home from "./pages/Home";
import MercadoLista from "./pages/mercados/MercadoLista";
import RelatoriosAutomaticos from "./pages/relatorios/RelatoriosAutomaticos";


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
      <div className="flex-1 flex flex-col min-w-0">
        <ContextSwitcher />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  </SidebarProvider>
);


const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <MainLayout>{children}</MainLayout>
  </ProtectedRoute>
);

/** Somente admin */
const AdminOnly = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <RoleRoute allow={['admin']}>
      <MainLayout>{children}</MainLayout>
    </RoleRoute>
  </ProtectedRoute>
);

/** Admin + manager (gestão/relatórios) */
const StaffOnly = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <RoleRoute allow={['admin', 'manager']}>
      <MainLayout>{children}</MainLayout>
    </RoleRoute>
  </ProtectedRoute>
);


const AuthenticatedDataProviders = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();

  if (!session) return <>{children}</>;

  return (
    <SupabaseGymDataProvider>
      <DataIntegrationProvider>
        <DemoModeProvider>{children}</DemoModeProvider>
      </DataIntegrationProvider>
    </SupabaseGymDataProvider>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OperationalContextProvider>
          <AuthenticatedDataProviders>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/anamnese/:token" element={<Anamnese />} />
                    <Route path="/select-context" element={<ProtectedRoute><SelectContext /></ProtectedRoute>} />
                    <Route path="/sindico" element={<ProtectedRoute><RoleRoute allow={['sindico','admin']}><SindicoHome /></RoleRoute></ProtectedRoute>} />
                    <Route path="/coach" element={<ProtectedRoute><RoleRoute allow={['professor','admin']}><CoachHome /></RoleRoute></ProtectedRoute>} />
                    <Route path="/corp" element={<ProtectedRoute><RoleRoute allow={['corporate','admin']}><CorpHome /></RoleRoute></ProtectedRoute>} />
                    <Route path="/morador" element={<ProtectedRoute><RoleRoute allow={['user','sindico','corporate','professor','admin','manager']}><MoradorHome /></RoleRoute></ProtectedRoute>} />
                    <Route path="/morador/health-day/:eventoId/confirmar" element={<ProtectedRoute><RoleRoute allow={['user','sindico','corporate','professor','admin','manager']}><HealthDayCheckin /></RoleRoute></ProtectedRoute>} />
                    <Route path="/admin/organizacoes" element={<AdminOnly><OrganizationsAdmin /></AdminOnly>} />
                    <Route path="/admin/fitpro" element={<AdminOnly><FitProIntegration /></AdminOnly>} />
                    <Route path="/operacao-9fit" element={<StaffOnly><Operacao9FIT /></StaffOnly>} />
                    <Route path="/cfo/leads" element={<AdminOnly><LeadsExtractionPlan /></AdminOnly>} />
                    <Route path="/pipeline" element={<AdminOnly><PipelineComercial /></AdminOnly>} />
                    <Route path="/clientes" element={<Protected><Clientes /></Protected>} />
                    <Route path="/contratos" element={<Protected><Contratos /></Protected>} />
                    <Route path="/planos-treino" element={<Protected><PlanosTreino /></Protected>} />
                    <Route path="/studio" element={<ProtectedRoute><RoleRoute allow={['admin','manager','professor']}><MainLayout><StudioHome /></MainLayout></RoleRoute></ProtectedRoute>} />
                    <Route path="/insights" element={<Protected><InsightsMercado /></Protected>} />
                    <Route path="/coaches" element={<Protected><Funcionarios /></Protected>} />
                   <Route path="/" element={<Navigate to="/home" replace />} />
                   <Route path="/home" element={<Protected><Home /></Protected>} />
                   <Route path="/mercados/:tipo" element={<Protected><MercadoLista /></Protected>} />
                   <Route path="/relatorios/automaticos" element={<StaffOnly><RelatoriosAutomaticos /></StaffOnly>} />

                    <Route path="/agents" element={<StaffOnly><AgentsHub /></StaffOnly>} />
                    <Route path="/admin/usuarios" element={<AdminOnly><UsersAdmin /></AdminOnly>} />
                    <Route path="/admin/reset-demo" element={<AdminOnly><ResetDemoData /></AdminOnly>} />
                    <Route path="/painel" element={<Protected><Painel /></Protected>} />
                    <Route path="/painel/inadimplencia" element={<Protected><Inadimplencia /></Protected>} />
                    <Route path="/painel/retencao" element={<Protected><Retencao /></Protected>} />
                    <Route path="/painel/agenda" element={<Protected><AgendaSemanal /></Protected>} />
                    <Route path="/painel/pipeline" element={<Protected><Pipeline /></Protected>} />
                    <Route path="/alunos" element={<Protected><SupabaseStudents /></Protected>} />
                    <Route path="/planos" element={<Protected><SupabasePlans /></Protected>} />
                    <Route path="/aulas" element={<Protected><SupabaseClasses /></Protected>} />
                    <Route path="/pagamentos" element={<Protected><SupabasePayments /></Protected>} />
                    <Route path="/checkin" element={<Protected><SupabaseCheckIn /></Protected>} />
                    <Route path="/equipamentos" element={<Protected><Equipment /></Protected>} />
                    <Route path="/treinos" element={<Protected><Treinos /></Protected>} />
                    <Route path="/relatorios" element={<StaffOnly><Relatorios /></StaffOnly>} />
                    <Route path="/relatorios/pagamentos" element={<StaffOnly><FluxoPagamentos /></StaffOnly>} />
                    <Route path="/relatorios/recebimentos" element={<StaffOnly><FluxoRecebimentos /></StaffOnly>} />
                    <Route path="/relatorios/cobrancas" element={<StaffOnly><Cobrancas /></StaffOnly>} />
                    <Route path="/relatorios/estrategias" element={<StaffOnly><EstrategiasIA /></StaffOnly>} />
                    <Route path="/relatorios/promocoes-cupons" element={<StaffOnly><PromocoesCupons /></StaffOnly>} />
                    <Route path="/marketing/campanhas" element={<Protected><Campanhas /></Protected>} />
                    <Route path="/marketing/captacao" element={<Protected><Captacao /></Protected>} />
                    <Route path="/marketing/comunicacao" element={<Protected><Comunicacao /></Protected>} />
                    <Route path="/marketing/conversao" element={<Protected><Conversao /></Protected>} />
                    <Route path="/marketing/funis" element={<Protected><Funis /></Protected>} />
                    <Route path="/marketing/email" element={<Protected><EmailMarketing /></Protected>} />
                    <Route path="/marketing/promocoes" element={<Protected><Promocoes /></Protected>} />
                    <Route path="/marketing/insights-ia" element={<Protected><InsightsIA /></Protected>} />
                    <Route path="/marketing/automacao" element={<Protected><Automacao /></Protected>} />
                    <Route path="/agente-ia" element={<Protected><AgenteIA /></Protected>} />
                    <Route path="/catalogo" element={<Protected><Catalogo /></Protected>} />
                    <Route path="/produtos" element={<Protected><Produtos /></Protected>} />
                    <Route path="/9fit" element={<Protected><Dashboard9FIT /></Protected>} />
                    <Route path="/9fit/ceo" element={<AdminOnly><CEODashboard /></AdminOnly>} />
                    <Route path="/9fit/consultoria" element={<Protected><ConsultoriaDashboard /></Protected>} />
                    <Route path="/9fit/concierge" element={<Protected><ConciergeDashboard /></Protected>} />
                    <Route path="/9fit/trust" element={<Protected><TrustDashboard /></Protected>} />
                    <Route path="/9fit/network" element={<Protected><NetworkDashboard /></Protected>} />
                    <Route path="/9fit/automation" element={<Protected><AutomationDashboard /></Protected>} />
                    <Route path="/9fit/store" element={<Protected><StoreDashboard /></Protected>} />
                    <Route path="/funcionarios" element={<Protected><Funcionarios /></Protected>} />
                    <Route path="/avaliacoes" element={<Protected><AvaliacoesFisicas /></Protected>} />
                    <Route path="/experimentais" element={<Protected><AulasExperimentais /></Protected>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
          </AuthenticatedDataProviders>
        </OperationalContextProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
