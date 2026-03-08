import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function ResponsiveLayout({ children, title, subtitle }: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`flex-1 overflow-auto ${isMobile ? 'p-4' : 'p-6'}`}>
      {isMobile && title ? (
        <div className="flex items-center justify-between mb-6 md:hidden">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center mb-6">
          <SidebarTrigger className="mr-4" />
        </div>
      )}
      {children}
    </div>
  );
}
