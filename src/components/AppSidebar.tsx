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

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      category: "Principal",
      items: [
        { title: "Painel", icon: Home, path: "/painel" },
        { title: "Alunos", icon: Users, path: "/alunos" },
        { title: "Check-in", icon: UserCheck, path: "/checkin" },
        { title: "Planos", icon: CreditCard, path: "/planos" },
        { title: "Pagamentos", icon: Receipt, path: "/pagamentos" },
        { title: "Aulas", icon: Calendar, path: "/aulas" },
        { title: "Equipamentos", icon: Dumbbell, path: "/equipamentos" },
        { title: "Produtos", icon: Package, path: "/produtos" },
      ],
    },
    {
      category: "Equipe & Avaliações",
      items: [
        { title: "Funcionários", icon: Briefcase, path: "/funcionarios" },
        { title: "Avaliações Físicas", icon: Activity, path: "/avaliacoes" },
        { title: "Aulas Experimentais", icon: UserCheck, path: "/experimentais" },
      ],
    },
    {
      category: "Treinos",
      items: [
        { title: "Treinos", icon: Dumbbell, path: "/treinos" },
      ],
    },
    {
      category: "Relatórios Financeiros 💰",
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
      category: "Marketing",
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
      category: "Inteligência Artificial",
      items: [
        { title: "Agente IA", icon: Bot, path: "/agente-ia" },
      ],
    },
    {
      category: "9FIT OS 🚀",
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

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            FitManage Pro
          </h1>
          <p className="text-sm text-muted-foreground">
            Sistema Completo de Gestão
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((category) => (
          <SidebarGroup key={category.category}>
            <SidebarGroupLabel>{category.category}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={location.pathname === item.path}
                      className="w-full justify-start"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
