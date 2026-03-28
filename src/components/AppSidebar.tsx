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
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCurrentUserRole, AppRole } from "@/hooks/useCurrentUserRole";

type MenuItem = {
  title: string;
  icon: any;
  path: string;
  roles?: AppRole[];
  badge?: number;
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

  const menuItems: MenuCategory[] = [
    {
      category: "PRINCIPAL",
      items: [
        { title: "Control Plane", icon: Home, path: "/painel" },
        { title: "Alunos", icon: Users, path: "/alunos", roles: ['admin', 'manager'] },
        { title: "Check-in", icon: UserCheck, path: "/checkin", roles: ['admin', 'manager'] },
        { title: "Planos", icon: CreditCard, path: "/planos", roles: ['admin'] },
        { title: "Catálogo (SKUs)", icon: Package, path: "/catalogo", roles: ['admin'] },
        { title: "Pagamentos", icon: Receipt, path: "/pagamentos", roles: ['admin'] },
        { title: "Aulas", icon: Calendar, path: "/aulas", roles: ['admin', 'manager'] },
        { title: "Equipamentos", icon: Dumbbell, path: "/equipamentos", roles: ['admin'] },
        { title: "Produtos", icon: Package, path: "/produtos", roles: ['admin'] },
      ],
    },
    {
      category: "EQUIPE & AVALIAÇÕES",
      roles: ['admin', 'manager'],
      items: [
        { title: "Funcionários", icon: Briefcase, path: "/funcionarios", roles: ['admin'] },
        { title: "Avaliações Físicas", icon: Activity, path: "/avaliacoes", roles: ['admin', 'manager'] },
        { title: "Aulas Experimentais", icon: UserCheck, path: "/experimentais", roles: ['admin', 'manager'] },
      ],
    },
    {
      category: "TREINOS",
      items: [
        { title: "Treinos", icon: Dumbbell, path: "/treinos" },
      ],
    },
    {
      category: "FINANCEIRO 💰",
      roles: ['admin'],
      items: [
        { title: "Dashboard", icon: BarChart3, path: "/relatorios" },
        { title: "Fluxo de Pagamentos", icon: ArrowDownCircle, path: "/relatorios/pagamentos" },
        { title: "Fluxo de Recebimentos", icon: ArrowUpCircle, path: "/relatorios/recebimentos" },
        { title: "Cobranças", icon: Receipt, path: "/relatorios/cobrancas" },
        { title: "Estratégias & IA", icon: Brain, path: "/relatorios/estrategias" },
        { title: "Promoções & Cupons", icon: Percent, path: "/relatorios/promocoes-cupons" },
      ],
    },
    {
      category: "MARKETING",
      roles: ['admin'],
      items: [
        { title: "Campanhas", icon: Target, path: "/marketing/campanhas" },
        { title: "Captação", icon: UserPlus, path: "/marketing/captacao" },
        { title: "Comunicação", icon: MessageSquare, path: "/marketing/comunicacao" },
        { title: "Conversão", icon: TrendingUp, path: "/marketing/conversao" },
        { title: "Funis", icon: Target, path: "/marketing/funis" },
        { title: "E-mail Marketing", icon: Mail, path: "/marketing/email" },
        { title: "Promoções", icon: Gift, path: "/marketing/promocoes" },
        { title: "Automação", icon: Zap, path: "/marketing/automacao" },
        { title: "Insights IA", icon: Sparkles, path: "/marketing/insights-ia" },
      ],
    },
    {
      category: "INTELIGÊNCIA ARTIFICIAL",
      items: [
        { title: "Agente IA", icon: Bot, path: "/agente-ia" },
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

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white flex items-center justify-center text-[11px] font-black text-navy font-mono rounded shrink-0">
              9F
            </div>
            <div>
              <div className="text-[11px] font-bold font-mono text-sidebar-foreground tracking-wider">FITMANAGER</div>
              <div className="text-[8px] text-sidebar-foreground/35 font-mono tracking-widest">9FIT ECOSYSTEM</div>
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
                <SidebarGroupLabel className="text-[8px] font-mono tracking-[0.14em] font-bold text-sidebar-foreground/20 px-3.5">
                  {category.category}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={location.pathname === item.path}
                          className="w-full justify-start text-xs"
                        >
                          <item.icon className="mr-2 h-3.5 w-3.5" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3.5 py-2.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-sidebar-foreground/15 flex items-center justify-center text-[10px] font-bold text-sidebar-foreground font-mono shrink-0">
            R
          </div>
          <div>
            <div className="text-[11px] font-semibold text-sidebar-foreground">Rony</div>
            <div className="text-[8px] text-sidebar-foreground/35 font-mono tracking-wider">CEO · 9FIT</div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
