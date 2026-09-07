import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  Dumbbell,
  BarChart3,
  Home,
  Target,
  UserPlus,
  MessageSquare,
  TrendingUp,
  Mail,
  Gift,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
  Brain,
  Percent,
  Zap,
  Sparkles,
  Bot,
  Rocket,
  Briefcase,
  Activity,
  UserCheck,
  Crown,
  HeartHandshake,
  Shield,
  Network,
  Settings,
  Store,
  LogOut,
  Building2,
  GraduationCap,
  User,
  ArrowLeftRight,
  ClipboardCheck,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCurrentUserRole, AppRole } from "@/hooks/useCurrentUserRole";
import { useDataIntegration } from "@/components/DataIntegrationProvider";
import { useMemo } from "react";

type MenuItem = {
  title: string;
  icon: any;
  path: string;
  roles?: AppRole[];
  badge?: number;
  badgeColor?: string;
};

type MenuCategory = {
  category: string;
  roles?: AppRole[];
  items: MenuItem[];
};

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useCurrentUserRole();
  const { signOut, user } = useAuth();
  const { pagamentos, alunos, checkins, leads, aulas } = useDataIntegration();

  // Dynamic badge counts
  const badges = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const hojeMs = Date.now();
    const MS_DIA = 86400000;

    // Inadimplentes
    const inadimplentes = (pagamentos || []).filter((p: any) =>
      p.status !== 'pago' && p.data_vencimento && p.data_vencimento < hoje
    ).length;

    // Alunos sem frequência (14+ dias)
    const checkinPorAluno = new Map<string, string>();
    (checkins || []).forEach((c: any) => {
      const dt = c.data_checkin || c.horario_entrada?.split('T')[0];
      if (!dt) return;
      const prev = checkinPorAluno.get(c.aluno_id);
      if (!prev || dt > prev) checkinPorAluno.set(c.aluno_id, dt);
    });
    const alunosSemFreq = (alunos || []).filter((a: any) => {
      if (a.status !== 'ativo') return false;
      const last = checkinPorAluno.get(a.id);
      if (!last) return true;
      return Math.ceil((hojeMs - new Date(last).getTime()) / MS_DIA) > 14;
    }).length;

    // Leads quentes (novos, < 7 dias)
    const leadsQuentes = (leads || []).filter((l: any) => {
      if (l.status !== 'novo') return false;
      const dias = Math.ceil((hojeMs - new Date(l.created_at).getTime()) / MS_DIA);
      return dias <= 7;
    }).length;

    // Aulas sem instrutor
    const aulasSemInst = (aulas || []).filter((a: any) =>
      a.data_aula >= hoje && !a.professor_id && a.status !== 'cancelada'
    ).length;

    return { inadimplentes, alunosSemFreq, leadsQuentes, aulasSemInst };
  }, [pagamentos, alunos, checkins, leads, aulas]);

  const menuItems: MenuCategory[] = [
    {
      category: "INÍCIO",
      items: [
        { title: "Home", icon: Home, path: "/home" },
        { title: "Trocar contexto", icon: ArrowLeftRight, path: "/select-context" },
      ],
    },
    {
      category: "CENTRAL DE OPERAÇÕES",
      items: [
        { title: "Visão geral", icon: LayoutDashboard, path: "/painel" },
        { title: "Operação NLIT", icon: ClipboardCheck, path: "/operacao-9fit", roles: ['admin','manager'] },
        { title: "Pipeline comercial", icon: Target, path: "/pipeline", roles: ['admin','manager'] },
        { title: "Clientes ativos", icon: Building2, path: "/clientes", roles: ['admin','manager'] },
        { title: "Alunos", icon: Users, path: "/alunos", roles: ['admin', 'manager'], badge: badges.alunosSemFreq || undefined, badgeColor: 'bg-amber-500' },
        { title: "Check-in", icon: UserCheck, path: "/checkin", roles: ['admin', 'manager'] },
        { title: "Agenda", icon: Calendar, path: "/painel/agenda" },
      ],
    },
    {
      category: "ASSESSORIA ESPORTIVA",
      items: [
        { title: "Treinos", icon: Dumbbell, path: "/treinos" },
        { title: "Planos de treino", icon: Dumbbell, path: "/planos-treino" },
        { title: "Studio", icon: Sparkles, path: "/studio", roles: ['admin', 'manager', 'professor'] },
        { title: "Avaliações físicas", icon: Activity, path: "/avaliacoes", roles: ['admin', 'manager'] },
        { title: "Aulas", icon: Calendar, path: "/aulas", roles: ['admin', 'manager'], badge: badges.aulasSemInst || undefined, badgeColor: 'bg-destructive' },
        { title: "Aulas experimentais", icon: UserCheck, path: "/experimentais", roles: ['admin', 'manager'] },
        { title: "Coaches & equipe", icon: Briefcase, path: "/coaches", roles: ['admin'] },
      ],
    },
    {
      category: "MERCADOS",
      roles: ['admin','manager'],
      items: [
        { title: "Condomínios", icon: Building2, path: "/mercados/condominios" },
        { title: "Corporativo", icon: Briefcase, path: "/mercados/corporativo" },
        { title: "Academias & Studios", icon: Dumbbell, path: "/mercados/academias" },
        { title: "Professores", icon: GraduationCap, path: "/mercados/professores" },
      ],
    },
    {
      category: "FINANCEIRO",
      roles: ['admin'],
      items: [
        { title: "Dashboard", icon: BarChart3, path: "/relatorios" },
        { title: "Contratos & propostas", icon: Receipt, path: "/contratos" },
        { title: "Pagamentos", icon: Receipt, path: "/pagamentos", badge: badges.inadimplentes || undefined, badgeColor: 'bg-destructive' },
        { title: "Fluxo de pagamentos", icon: ArrowDownCircle, path: "/relatorios/pagamentos" },
        { title: "Fluxo de recebimentos", icon: ArrowUpCircle, path: "/relatorios/recebimentos" },
        { title: "Cobranças", icon: Receipt, path: "/relatorios/cobrancas" },
        { title: "Planos & SKUs", icon: Package, path: "/catalogo" },
        { title: "Estratégias & IA", icon: Brain, path: "/relatorios/estrategias" },
        { title: "Promoções & cupons", icon: Percent, path: "/relatorios/promocoes-cupons" },
      ],
    },
    {
      category: "MARKETING & CAPTAÇÃO",
      roles: ['admin'],
      items: [
        { title: "Campanhas", icon: Target, path: "/marketing/campanhas" },
        { title: "Captação", icon: UserPlus, path: "/marketing/captacao", badge: badges.leadsQuentes || undefined, badgeColor: 'bg-orange-500' },
        { title: "Comunicação", icon: MessageSquare, path: "/marketing/comunicacao" },
        { title: "Conversão", icon: TrendingUp, path: "/marketing/conversao" },
        { title: "Funis", icon: Target, path: "/marketing/funis" },
        { title: "E-mail marketing", icon: Mail, path: "/marketing/email" },
        { title: "Promoções", icon: Gift, path: "/marketing/promocoes" },
        { title: "Automação", icon: Zap, path: "/marketing/automacao" },
      ],
    },
    {
      category: "CENTRO DE INTELIGÊNCIA",
      items: [
        { title: "Hub de Agentes", icon: Bot, path: "/agents", roles: ['admin','manager'] },
        { title: "RON • Agente CEO", icon: Sparkles, path: "/agente-ia" },
        { title: "Insights de mercado", icon: BarChart3, path: "/insights", roles: ['admin'] },
        { title: "Plano CFO", icon: Target, path: "/cfo/leads", roles: ['admin'] },
        { title: "Relatórios automáticos", icon: Receipt, path: "/relatorios/automaticos", roles: ['admin','manager'] },
      ],
    },
    {
      category: "NINE LIVING",
      items: [
        { title: "Health Day · Gestão", icon: HeartHandshake, path: "/sindico/health-day", roles: ['sindico', 'admin'] },
        { title: "Eventos do condomínio", icon: Calendar, path: "/morador/eventos", roles: ['user', 'admin'] },
      ],
    },
    {
      category: "ADMINISTRAÇÃO",
      roles: ['admin'],
      items: [
        { title: "Usuários", icon: Shield, path: "/admin/usuarios", roles: ['admin'] },
        { title: "Organizações", icon: Network, path: "/admin/organizacoes", roles: ['admin'] },
        { title: "Auditoria de prescrições", icon: ClipboardCheck, path: "/admin/auditoria-prescricoes", roles: ['admin'] },
        { title: "Auditoria de acessos", icon: Shield, path: "/admin/auditoria-acessos", roles: ['admin'] },
        { title: "Produtos & equipamentos", icon: Package, path: "/produtos", roles: ['admin'] },
        { title: "Equipamentos", icon: Dumbbell, path: "/equipamentos", roles: ['admin'] },
      ],
    },
    {
      category: "9FIT OS 🚀",
      roles: ['admin'],
      items: [
        { title: "Dashboard 9FIT", icon: Rocket, path: "/9fit" },
        { title: "CEO", icon: Crown, path: "/9fit/ceo" },
        { title: "Consultoria", icon: HeartHandshake, path: "/9fit/consultoria" },
        { title: "Concierge", icon: Users, path: "/9fit/concierge" },
        { title: "Trust", icon: Shield, path: "/9fit/trust" },
        { title: "Network", icon: Network, path: "/9fit/network" },
        { title: "Automação", icon: Settings, path: "/9fit/automation" },
        { title: "Store", icon: Store, path: "/9fit/store" },
      ],
    },
  ];


  const canSee = (roles?: AppRole[]) => {
    if (!roles) return true;
    if (!role) return true;
    return roles.includes(role);
  };

  const nomeUsuario = (user?.user_metadata as any)?.nome || user?.email?.split('@')[0] || 'Usuário';
  const inicial = nomeUsuario.charAt(0).toUpperCase();
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : '9FIT';

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-5 border-b border-sidebar-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-gold flex items-center justify-center text-[12px] font-black text-primary-foreground font-display rounded-md shrink-0 shadow-gold">
              9F
            </div>
            <div>
              <div className="text-[12px] font-bold font-display text-sidebar-foreground tracking-wide">NINE LIVING</div>
              <div className="text-[8px] text-primary/70 font-mono tracking-[0.2em] uppercase mt-0.5">SAÚDE · COMUNIDADE</div>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems
          .filter(cat => canSee(cat.roles))
          .map((category) => {
            const visibleItems = category.items.filter(item => canSee(item.roles));
            if (visibleItems.length === 0) return null;
            return (
              <SidebarGroup key={category.category}>
                <SidebarGroupLabel className="text-[9px] font-mono tracking-[0.18em] font-semibold text-primary/50 px-3.5 mt-1">
                  {category.category}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            onClick={() => navigate(item.path)}
                            isActive={isActive}
                            className={`w-full justify-start text-xs rounded-md transition-all duration-150 ${
                              isActive
                                ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent border-l-2 border-transparent'
                            }`}
                          >
                            <item.icon className={`mr-2 h-3.5 w-3.5 ${isActive ? 'text-primary' : ''}`} />
                            <span className="flex-1">{item.title}</span>
                            {item.badge && item.badge > 0 && (
                              <span className={`ml-auto min-w-[18px] h-[18px] rounded-full ${item.badgeColor || 'bg-destructive'} text-white text-[9px] font-mono font-bold flex items-center justify-center px-1.5 shadow-sm`}>
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3.5 py-3 flex items-center gap-2 justify-between border-t border-sidebar-border/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-[11px] font-bold text-primary-foreground font-display shrink-0 shadow-gold">
              {inicial}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-sidebar-foreground truncate">{nomeUsuario}</div>
              <div className="text-[8px] text-primary/60 font-mono tracking-wider uppercase">{roleLabel} · NINE LIVING</div>
            </div>
          </div>
          <button onClick={() => signOut()} className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-primary transition-colors shrink-0" title="Sair">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
