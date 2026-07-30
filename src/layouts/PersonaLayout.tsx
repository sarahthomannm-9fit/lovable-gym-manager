import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  LogOut, ArrowLeftRight, Building2, GraduationCap, Briefcase, User,
  LayoutDashboard, Bot, Network,
  ClipboardCheck,
} from 'lucide-react';

const ICONS: Record<string, any> = {
  sindico: Building2, professor: GraduationCap, corporate: Briefcase,
  condominio: Building2, studio: GraduationCap,
};

type NavLink = { label: string; path: string; icon: any; accent: string };

const PERSONA_LINKS: NavLink[] = [
  { label: 'Síndico', path: '/sindico', icon: Building2, accent: 'hsl(var(--primary))' },
  { label: 'Coach', path: '/coach', icon: GraduationCap, accent: 'hsl(var(--primary))' },
  { label: 'Corporativo', path: '/corp', icon: Briefcase, accent: 'hsl(var(--primary))' },
  { label: 'Morador', path: '/morador', icon: User, accent: 'hsl(var(--primary))' },
];

export function PersonaLayout({
  title, subtitle, accent = 'hsl(var(--primary))', children,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
  children: ReactNode;
}) {
  const { activeOrg, activeRole, memberships, isAdmin, setActiveOrg } = useOperationalContext();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const Icon = ICONS[activeRole as string] || Building2;

  // Org options visible to user: memberships + (admin only) any saved active org
  const orgOptions = Array.from(
    new Map(memberships.map((m) => [m.organization.id, m.organization])).values(),
  );
  if (activeOrg && !orgOptions.find((o) => o.id === activeOrg.id)) orgOptions.unshift(activeOrg);

  const adminLinks: NavLink[] = isAdmin
    ? [
        { label: 'Painel admin', path: '/painel', icon: LayoutDashboard, accent: 'hsl(var(--primary))' },
        { label: 'Operação 9FIT', path: '/operacao-9fit', icon: ClipboardCheck, accent: 'hsl(var(--primary))' },
        { label: 'Hub Agentes', path: '/agents', icon: Bot, accent: 'hsl(var(--primary))' },
        { label: 'Organizações', path: '/admin/organizacoes', icon: Network, accent: 'hsl(var(--primary))' },
      ]
    : [];

  // Persona links visible: admin sees all; non-admin sees only those matching memberships
  const visiblePersonas = isAdmin
    ? PERSONA_LINKS
    : PERSONA_LINKS.filter((p) => {
        if (p.path === '/morador') return true;
        const tipo = p.path === '/sindico' ? 'condominio'
          : p.path === '/coach' ? 'professor'
          : p.path === '/corp' ? 'corporate' : null;
        return tipo && memberships.some((m) => m.organization.tipo === tipo);
      });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-card/60 backdrop-blur-xl sticky top-0 z-10 shadow-elegant">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
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

          <div className="flex items-center gap-2 flex-wrap">
            {orgOptions.length > 1 && (
              <Select
                value={activeOrg?.id || ''}
                onValueChange={(id) => {
                  const o = orgOptions.find((x) => x.id === id);
                  if (o) setActiveOrg(o);
                }}
              >
                <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="Org" /></SelectTrigger>
                <SelectContent>
                  {orgOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id} className="text-xs">{o.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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

        {/* Nav strip */}
        <div className="border-t border-border/20 bg-background/40">
          <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center gap-1 overflow-x-auto">
            {[...visiblePersonas, ...adminLinks].map((l) => {
              const I = l.icon;
              const active = location.pathname === l.path;
              return (
                <button
                  key={l.path}
                  onClick={() => navigate(l.path)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    active ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                  }`}
                  style={active ? { color: l.accent } : undefined}
                >
                  <I className="w-3.5 h-3.5" /> {l.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

export function PersonaEmptyState({
  message = 'Selecione uma organização para visualizar este painel.',
}: { message?: string }) {
  const navigate = useNavigate();
  return (
    <div className="border border-dashed border-border/40 rounded-lg p-10 text-center">
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <Button onClick={() => navigate('/select-context')} variant="outline">
        <ArrowLeftRight className="w-4 h-4 mr-1" /> Selecionar contexto
      </Button>
    </div>
  );
}
