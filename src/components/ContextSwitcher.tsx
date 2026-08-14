import { useNavigate } from 'react-router-dom';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, GraduationCap, Briefcase, User, ChevronDown, LogOut, ArrowLeftRight, Sparkles } from 'lucide-react';

const PERSONAS = [
  { label: 'Síndico', path: '/sindico', icon: Building2 },
  { label: 'Coach', path: '/coach', icon: GraduationCap },
  { label: 'Corporativo', path: '/corp', icon: Briefcase },
  { label: 'Morador', path: '/morador', icon: User },
  { label: 'Studio', path: '/studio', icon: Sparkles, roles: ['admin', 'manager', 'professor'] },
];

/** Seletor de contexto no topo: Usuário → Organização → Persona (troca sem logout) */
export function ContextSwitcher() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { activeOrg, memberships, setActiveOrg, isAdmin, primaryRole } = useOperationalContext();

  const orgs = Array.from(new Map(memberships.map((m) => [m.organization.id, m.organization])).values());
  if (activeOrg && !orgs.find((o) => o.id === activeOrg.id)) orgs.unshift(activeOrg as any);

  const nome = (user?.user_metadata as any)?.nome || user?.email?.split('@')[0] || 'Usuário';

  const canSeePersona = (roles?: string[]) => {
    if (!roles) return true;
    if (isAdmin) return true;
    if (!primaryRole) return true;
    return roles.includes(primaryRole);
  };

  return (
    <header className="h-12 shrink-0 border-b border-border/40 bg-card/40 backdrop-blur-xl sticky top-0 z-20 flex items-center gap-2 px-3">
      <SidebarTrigger />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5">
            <span className="font-medium">{nome}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground truncate max-w-[160px]">{activeOrg?.nome || 'Todos os contextos'}</span>
            {primaryRole && <span className="text-muted-foreground">/ {primaryRole}</span>}
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Organização</DropdownMenuLabel>
          {orgs.length === 0 && <DropdownMenuItem disabled className="text-xs">Nenhum vínculo</DropdownMenuItem>}
          {orgs.map((o) => (
            <DropdownMenuItem key={o.id} className="text-xs" onClick={() => setActiveOrg(o as any)}>
              {o.nome}{activeOrg?.id === o.id && ' ✓'}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Persona</DropdownMenuLabel>
          {PERSONAS.filter((p) => canSeePersona((p as any).roles)).map((p) => (
            <DropdownMenuItem key={p.path} className="text-xs" onClick={() => navigate(p.path)}>
              <p.icon className="w-3.5 h-3.5 mr-2" /> {p.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs" onClick={() => navigate('/select-context')}>
            <ArrowLeftRight className="w-3.5 h-3.5 mr-2" /> Trocar contexto
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs" onClick={() => signOut()}>
            <LogOut className="w-3.5 h-3.5 mr-2" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isAdmin && (
        <span className="ml-auto text-[10px] uppercase tracking-[0.16em] text-primary/70 font-mono hidden sm:block">
          9FIT · admin
        </span>
      )}
    </header>
  );
}
