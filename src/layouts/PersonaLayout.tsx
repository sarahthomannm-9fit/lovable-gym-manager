import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeftRight, Building2, GraduationCap, Briefcase } from 'lucide-react';

const ICONS = { sindico: Building2, professor: GraduationCap, corporate: Briefcase, condominio: Building2, studio: GraduationCap } as any;

export function PersonaLayout({
  title,
  subtitle,
  accent = '#C8FF00',
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
  children: ReactNode;
}) {
  const { activeOrg, activeRole, memberships, isAdmin } = useOperationalContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const Icon = ICONS[activeRole as string] || Building2;

  return (
    <div className="min-h-screen bg-[#07070A] text-foreground">
      <header className="border-b border-border/30 bg-card/40 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                 style={{ backgroundColor: `${accent}1A`, color: accent }}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate">{title}</h1>
              {(activeOrg || subtitle) && (
                <p className="text-xs text-muted-foreground truncate">
                  {activeOrg?.nome || subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(memberships.length > 1 || isAdmin) && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/select-context')}>
                <ArrowLeftRight className="w-4 h-4 mr-1" /> Trocar
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
