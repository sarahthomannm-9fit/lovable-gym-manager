
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
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface AppSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const menuItems = [
    {
      category: "Principal",
      items: [
        {
          title: "Painel",
          icon: Home,
          key: "painel",
          path: "/painel",
        },
        {
          title: "Alunos",
          icon: Users,
          key: "alunos",
          path: "/alunos",
        },
        {
          title: "Planos",
          icon: CreditCard,
          key: "planos",
          path: "/planos",
        },
        {
          title: "Aulas",
          icon: Calendar,
          key: "aulas",
          path: "/aulas",
        },
      ],
    },
    {
      category: "Treinos & Relatórios",
      items: [
        {
          title: "Treinos",
          icon: Dumbbell,
          key: "treinos",
          path: "/treinos",
        },
        {
          title: "Relatórios",
          icon: BarChart3,
          key: "relatorios",
          path: "/relatorios",
        },
      ],
    },
    {
      category: "Marketing",
      items: [
        {
          title: "Campanhas",
          icon: Target,
          key: "campanhas",
          path: "/marketing/campanhas",
        },
        {
          title: "Captação",
          icon: UserPlus,
          key: "captacao",
          path: "/marketing/captacao",
        },
        {
          title: "Comunicação",
          icon: MessageSquare,
          key: "comunicacao",
          path: "/marketing/comunicacao",
        },
        {
          title: "Conversão",
          icon: TrendingUp,
          key: "conversao",
          path: "/marketing/conversao",
        },
        {
          title: "E-mail Marketing",
          icon: Mail,
          key: "email-marketing",
          path: "/marketing/email",
        },
        {
          title: "Promoções",
          icon: Gift,
          key: "promocoes",
          path: "/marketing/promocoes",
        },
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
                  <SidebarMenuItem key={item.key}>
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
