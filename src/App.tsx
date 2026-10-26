import { PersonaLayout } from '@/layouts/PersonaLayout';
import { FeatureGate } from '@/components/FeatureGate';
import { EnvironmentBadge } from '@/components/EnvironmentBadge';
import { useState } from 'react';
import { contextKey } from '@/lib/tenant';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import Requests from './pages/admin/Requests';
import VinculosOrfaos from './pages/admin/VinculosOrfaos';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import HealthDay from "./pages/sindico/HealthDay";
import SindicoOperacao from "./pages/sindico/Operacao";
import Announcements from "./pages/sindico/Announcements";
import CoachHome from "./pages/coach/CoachHome";
import ReviewQueue from "./pages/coach/ReviewQueue";
import CorpHome from "./pages/corp/CorpHome";
import OrganizationsAdmin from "./pages/admin/OrganizationsAdmin";
import PrescriptionAudit from "./pages/admin/PrescriptionAudit";
import AccessAudit from "./pages/admin/AccessAudit";
import WorkflowApprovals from "./pages/admin/WorkflowApprovals";
import AcceptInvite from "./pages/AcceptInvite";
import FirstAccess from "./pages/FirstAccess";
import MoradorHome from "./pages/morador/MoradorHome";
import OnboardingMorador from "./pages/morador/OnboardingMorador";
import Events from "./pages/morador/Events";
import ResidentEntry from "./pages/morador/ResidentEntry";
import MoradorProfile from "./pages/morador/Profile";
import MoradorAgenda from "./pages/morador/Agenda";
import MoradorStaff from "./pages/morador/MoradorStaff";
import MoradorOperacao from "./pages/morador/OperacaoAreas";
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
    <RoleRoute allow={['admin', 'manager']}>
      <MainLayout>{children}</MainLayout>
    </RoleRoute>
  </ProtectedRoute>
);

const TrainingLayout=({children}:{children:React.ReactNode})=>{
  const {activeRole}=useOperationalContext();
  const {pathname}=useLocation();
  return activeRole==='professor'?<PersonaLayout title={pathname==='/planos-treino'?'Planos de treino':'Treinos'}>{children}</PersonaLayout>:<MainLayout>{children}</MainLayout>;
};

const TrainingAccess = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <RoleRoute allow={['admin', 'manager', 'professor']}>
      <TrainingLayout>{children}</TrainingLayout>
    </RoleRoute>
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


const TenantDataProviders = ({ children,legacy }: { children: React.ReactNode;legacy:boolean }) => {
  const [tenantQueryClient]=useState(()=>new QueryClient({defaultOptions:{queries:{retry:1,refetchOnWindowFocus:false}}}));
  const content=legacy?<SupabaseGymDataProvider><DataIntegrationProvider><DemoModeProvider>{children}</DemoModeProvider></DataIntegrationProvider></SupabaseGymDataProvider>:children;
  return <QueryClientProvider client={tenantQueryClient}>{content}</QueryClientProvider>;
};

const AuthenticatedDataProviders = ({ children }: { children: React.ReactNode }) => {
  const {user}=useAuth();
  const {activeOrg,activeRole,isAdmin,memberships,loading}=useOperationalContext();
  const {pathname}=useLocation();
  const personaSurface=['/morador','/coach','/sindico','/corp','/entrada','/convite','/select-context','/login','/forgot-password','/reset-password','/anamnese','/primeiro-acesso'].some(path=>pathname.startsWith(path));
  const roles=memberships.filter(m=>m.organization_id===activeOrg?.id).map(m=>m.papel);
  const coachTraining=activeRole==='professor'&&['/treinos','/planos-treino'].includes(pathname);
  const legacy=!personaSurface&&!coachTraining&&(isAdmin||roles.includes('manager'));
  if(!user)return <>{children}</>;
  if(loading)return <div role="status" className="p-6">Carregando acesso…</div>;
  return <TenantDataProviders legacy={legacy} key={contextKey(user.id,activeOrg?.id,activeRole)+':'+legacy}>{children}</TenantDataProviders>;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OperationalContextProvider>
          <BrowserRouter><AuthenticatedDataProviders>
              <TooltipProvider>
                <Toaster />
                <Sonner />

                  <EnvironmentBadge/>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/anamnese/:token" element={<Anamnese />} />
                    <Route path="/entrada" element={<ResidentEntry />} />
                    <Route path="/convite/:token" element={<AcceptInvite />} />
                    <Route path="/convite-coach/:token" element={<AcceptInvite />} />
                    <Route path="/primeiro-acesso" element={<ProtectedRoute><FirstAccess /></ProtectedRoute>} />
                    <Route path="/select-context" element={<ProtectedRoute><SelectContext /></ProtectedRoute>} />
                    <Route path="/sindico" element={<ProtectedRoute><RoleRoute allow={['sindico','admin']}><SindicoHome /></RoleRoute></ProtectedRoute>} />
                    <Route path="/sindico/health-day" element={<ProtectedRoute><RoleRoute allow={['sindico','admin']}><HealthDay /></RoleRoute></ProtectedRoute>} />
                    <Route path="/sindico/operacao" element={<ProtectedRoute><RoleRoute allow={['sindico','admin']}><SindicoOperacao /></RoleRoute></ProtectedRoute>} />
                    <Route path="/sindico/comunicados" element={<ProtectedRoute><RoleRoute allow={['sindico','admin']}><Announcements /></RoleRoute></ProtectedRoute>} />
                    <Route path="/coach" element={<ProtectedRoute><RoleRoute allow={['professor','admin']}><CoachHome /></RoleRoute></ProtectedRoute>} />
                    <Route path="/coach/revisoes" element={<ProtectedRoute><RoleRoute allow={['professor','admin']}><ReviewQueue /></RoleRoute></ProtectedRoute>} />
                    <Route path="/corp" element={<ProtectedRoute><RoleRoute allow={['corporate','admin']}><FeatureGate feature="corporate"><CorpHome /></FeatureGate></RoleRoute></ProtectedRoute>} />
                    <Route path="/morador" element={<ProtectedRoute><RoleRoute allow={['user','admin']}><MoradorHome /></RoleRoute></ProtectedRoute>} />
                    <Route path="/morador/onboarding" element={<ProtectedRoute><OnboardingMorador /></ProtectedRoute>} />
                    <Route path="/morador/eventos" element={<ProtectedRoute><RoleRoute allow={['user','admin']}><Events /></RoleRoute></ProtectedRoute>} />
                    <Route path="/morador/perfil" element={<ProtectedRoute><RoleRoute allow={['user','admin']}><MoradorProfile /></RoleRoute></ProtectedRoute>} />
                    <Route path="/morador/agenda" element={<ProtectedRoute><RoleRoute allow={['user','admin']}><MoradorAgenda /></RoleRoute></ProtectedRoute>} />
                    <Route path="/morador/staff" element={<ProtectedRoute><RoleRoute allow={['user','admin']}><FeatureGate feature="staff"><MoradorStaff /></FeatureGate></RoleRoute></ProtectedRoute>} />
                    <Route path="/morador/operacao" element={<ProtectedRoute><RoleRoute allow={['user','admin']}><MoradorOperacao /></RoleRoute></ProtectedRoute>} />
                    <Route path="/admin" element={<AdminOnly><Navigate to="/admin/organizacoes" replace /></AdminOnly>} />
                    <Route path="/admin/solicitacoes" element={<AdminOnly><Requests /></AdminOnly>} />
                    <Route path="/admin/vinculos" element={<AdminOnly><VinculosOrfaos /></AdminOnly>} />
                    <Route path="/admin/organizacoes" element={<AdminOnly><OrganizationsAdmin /></AdminOnly>} />
                    <Route path="/admin/auditoria-prescricoes" element={<AdminOnly><PrescriptionAudit /></AdminOnly>} />
                    <Route path="/admin/auditoria-acessos" element={<AdminOnly><AccessAudit /></AdminOnly>} />
                    <Route path="/admin/aprovacoes-workflows" element={<StaffOnly><WorkflowApprovals /></StaffOnly>} />
                    <Route path="/admin/fitpro" element={<AdminOnly><FitProIntegration /></AdminOnly>} />
                    <Route path="/operacao-9fit" element={<StaffOnly><Operacao9FIT /></StaffOnly>} />
                    <Route path="/cfo/leads" element={<AdminOnly><LeadsExtractionPlan /></AdminOnly>} />
                    <Route path="/pipeline" element={<StaffOnly><PipelineComercial /></StaffOnly>} />
                    <Route path="/clientes" element={<Protected><Clientes /></Protected>} />
                    <Route path="/contratos" element={<Protected><Contratos /></Protected>} />
                    <Route path="/planos-treino" element={<TrainingAccess><PlanosTreino /></TrainingAccess>} />
                    <Route path="/studio" element={<ProtectedRoute><RoleRoute allow={['admin','manager']}><MainLayout><StudioHome /></MainLayout></RoleRoute></ProtectedRoute>} />
                    <Route path="/insights" element={<Protected><InsightsMercado /></Protected>} />
                    <Route path="/coaches" element={<StaffOnly><Funcionarios /></StaffOnly>} />
                   <Route path="/" element={<Navigate to="/home" replace />} />
                   <Route path="/home" element={<Protected><Home /></Protected>} />
                   <Route path="/mercados/:tipo" element={<Protected><MercadoLista /></Protected>} />
                    <Route path="/relatorios/automaticos" element={<AdminOnly><FeatureGate feature="ai_reports"><RelatoriosAutomaticos /></FeatureGate></AdminOnly>} />

                    <Route path="/agents" element={<StaffOnly><AgentsHub /></StaffOnly>} />
                    <Route path="/admin/usuarios" element={<AdminOnly><UsersAdmin /></AdminOnly>} />
                    <Route path="/admin/reset-demo" element={<AdminOnly><ResetDemoData /></AdminOnly>} />
                    <Route path="/painel" element={<StaffOnly><Painel /></StaffOnly>} />
                    <Route path="/painel/inadimplencia" element={<StaffOnly><Inadimplencia /></StaffOnly>} />
                    <Route path="/painel/retencao" element={<StaffOnly><Retencao /></StaffOnly>} />
                    <Route path="/painel/agenda" element={<StaffOnly><AgendaSemanal /></StaffOnly>} />
                    <Route path="/painel/pipeline" element={<StaffOnly><Pipeline /></StaffOnly>} />
                    <Route path="/alunos" element={<Protected><SupabaseStudents /></Protected>} />
                    <Route path="/planos" element={<Protected><SupabasePlans /></Protected>} />
                    <Route path="/aulas" element={<StaffOnly><SupabaseClasses /></StaffOnly>} />
                    <Route path="/pagamentos" element={<Protected><SupabasePayments /></Protected>} />
                    <Route path="/checkin" element={<Protected><SupabaseCheckIn /></Protected>} />
                    <Route path="/equipamentos" element={<Protected><Equipment /></Protected>} />
                    <Route path="/treinos" element={<TrainingAccess><Treinos /></TrainingAccess>} />
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
                    <Route path="/funcionarios" element={<StaffOnly><Funcionarios /></StaffOnly>} />
                    <Route path="/avaliacoes" element={<StaffOnly><AvaliacoesFisicas /></StaffOnly>} />
                    <Route path="/experimentais" element={<StaffOnly><AulasExperimentais /></StaffOnly>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>

              </TooltipProvider>
          </AuthenticatedDataProviders></BrowserRouter>
        </OperationalContextProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
