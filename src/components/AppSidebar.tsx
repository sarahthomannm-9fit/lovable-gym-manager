
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
  TrendingUp,
  BarChart3,
  FileText,
  MessageCircle,
  CreditCard,
  MessageSquare,
  Dumbbell,
  UserCheck,
  Settings,
  Wrench,
} from "lucide-react";

interface AppSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const menuItems = [
    {
      category: "Principal",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          key: "dashboard",
        },
        {
          title: "Check-in",
          icon: UserCheck,
          key: "checkin",
        },
        {
          title: "Aulas",
          icon: Calendar,
          key: "classes",
        },
        {
          title: "Alunos",
          icon: Users,
          key: "students",
        },
      ],
    },
    {
      category: "Treinos & Performance",
      items: [
        {
          title: "Treinos",
          icon: Dumbbell,
          key: "workouts",
        },
        {
          title: "Performance",
          icon: TrendingUp,
          key: "performance",
        },
      ],
    },
    {
      category: "Gestão",
      items: [
        {
          title: "Planos",
          icon: Settings,
          key: "plans",
        },
        {
          title: "Equipamentos",
          icon: Wrench,
          key: "equipment",
        },
        {
          title: "Documentos",
          icon: FileText,
          key: "documents",
        },
        {
          title: "Comunicação",
          icon: MessageCircle,
          key: "communication",
        },
        {
          title: "Pagamentos",
          icon: CreditCard,
          key: "payments",
        },
      ],
    },
    {
      category: "Analytics",
      items: [
        {
          title: "Relatórios",
          icon: BarChart3,
          key: "reports",
        },
        {
          title: "Feedback",
          icon: MessageSquare,
          key: "feedback",
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
                      onClick={() => onViewChange(item.key)}
                      isActive={activeView === item.key}
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
