import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GymDataProvider } from "@/contexts/GymDataContext";
import { SupabaseGymDataProvider } from "@/contexts/SupabaseGymDataContext";
import { DataIntegrationProvider } from "@/components/DataIntegrationProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Painel } from "./pages/Painel";
import { Treinos } from "./pages/Treinos";
import { Relatorios } from "./pages/Relatorios";
import { FluxoPagamentos } from "./pages/relatorios/FluxoPagamentos";
import { FluxoRecebimentos } from "./pages/relatorios/FluxoRecebimentos";
import { Cobrancas } from "./pages/relatorios/Cobrancas";
import { EstrategiasIA } from "./pages/relatorios/EstrategiasIA";
import { PromocoesCupons } from "./pages/relatorios/PromocoesCupons";
import { Students } from "./components/Students";
import { Plans } from "./components/Plans";
import { Classes } from "./components/Classes";
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

// Configuração otimizada do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SupabaseGymDataProvider>
          <GymDataProvider>
            <DataIntegrationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/painel" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1">
                            <Painel />
                          </main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  {/* Protected routes with sidebar */}
                  <Route path="/alunos" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Students /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/planos" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Plans /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/aulas" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Classes /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/treinos" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Treinos /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/relatorios" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Relatorios /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/relatorios/pagamentos" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><FluxoPagamentos /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/relatorios/recebimentos" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><FluxoRecebimentos /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/relatorios/cobrancas" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Cobrancas /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/relatorios/estrategias" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><EstrategiasIA /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/relatorios/promocoes-cupons" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><PromocoesCupons /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/marketing/campanhas" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Campanhas /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/marketing/captacao" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Captacao /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/marketing/comunicacao" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Comunicacao /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/marketing/conversao" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Conversao /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/marketing/funis" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Funis /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/marketing/email" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><EmailMarketing /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/marketing/promocoes" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Promocoes /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/marketing/insights-ia" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><InsightsIA /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/marketing/automacao" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Automacao /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/agente-ia" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><AgenteIA /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/produtos" element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar activeView="" onViewChange={() => {}} />
                          <main className="flex-1"><Produtos /></main>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  } />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </DataIntegrationProvider>
        </GymDataProvider>
      </SupabaseGymDataProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
