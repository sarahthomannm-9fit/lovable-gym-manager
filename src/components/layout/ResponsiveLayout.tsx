
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileHeader } from "./MobileHeader";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  title: string;
  subtitle?: string;
}

export function ResponsiveLayout({ children, activeView, onViewChange, title, subtitle }: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar activeView={activeView} onViewChange={onViewChange} />
        <main className={`flex-1 overflow-auto ${isMobile ? 'p-4' : 'p-6'}`}>
          {isMobile ? (
            <MobileHeader title={title} subtitle={subtitle} />
          ) : (
            <div className="flex items-center mb-6">
              <SidebarTrigger className="mr-4" />
            </div>
          )}
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
