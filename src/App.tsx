
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GymDataProvider } from "@/contexts/GymDataContext";
import { SupabaseGymDataProvider } from "@/contexts/SupabaseGymDataContext";
import { DataIntegrationProvider } from "@/components/DataIntegrationProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Painel } from "./pages/Painel";
import { Treinos } from "./pages/Treinos";
import { Relatorios } from "./pages/Relatorios";
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
import { Produtos } from "./pages/Produtos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SupabaseGymDataProvider>
      <GymDataProvider>
        <DataIntegrationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  <AppSidebar activeView="" onViewChange={() => {}} />
                  <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/painel" element={<Painel />} />
                    <Route path="/alunos" element={<Students />} />
                    <Route path="/planos" element={<Plans />} />
                    <Route path="/aulas" element={<Classes />} />
                    <Route path="/treinos" element={<Treinos />} />
                    <Route path="/relatorios" element={<Relatorios />} />
                    <Route path="/marketing/campanhas" element={<Campanhas />} />
                    <Route path="/marketing/captacao" element={<Captacao />} />
                    <Route path="/marketing/comunicacao" element={<Comunicacao />} />
                    <Route path="/marketing/conversao" element={<Conversao />} />
                    <Route path="/marketing/funis" element={<Funis />} />
                    <Route path="/marketing/email" element={<EmailMarketing />} />
                    <Route path="/marketing/promocoes" element={<Promocoes />} />
                    <Route path="/produtos" element={<Produtos />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </SidebarProvider>
          </BrowserRouter>
        </TooltipProvider>
      </DataIntegrationProvider>
    </GymDataProvider>
  </SupabaseGymDataProvider>
</QueryClientProvider>
);

export default App;
