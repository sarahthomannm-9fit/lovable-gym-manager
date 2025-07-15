
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GymDataProvider } from "@/contexts/GymDataContext";
import { SupabaseGymDataProvider } from "@/contexts/SupabaseGymDataContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SupabaseGymDataProvider>
      <GymDataProvider>
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
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </SidebarProvider>
          </BrowserRouter>
        </TooltipProvider>
      </GymDataProvider>
    </SupabaseGymDataProvider>
  </QueryClientProvider>
);

export default App;
