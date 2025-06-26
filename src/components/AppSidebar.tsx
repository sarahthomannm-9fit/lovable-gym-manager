
import { 
  BarChart3, 
  Users, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  MessageSquare, 
  FileText 
} from "lucide-react";
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

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  {
    title: "Dashboard",
    id: "dashboard",
    icon: BarChart3,
  },
  {
    title: "Alunos",
    id: "students",
    icon: Users,
  },
  {
    title: "Aulas",
    id: "classes",
    icon: Calendar,
  },
  {
    title: "Pagamentos",
    id: "payments",
    icon: CreditCard,
  },
  {
    title: "Desempenho",
    id: "performance",
    icon: TrendingUp,
  },
  {
    title: "Feedback",
    id: "feedback",
    icon: MessageSquare,
  },
  {
    title: "Relatórios",
    id: "reports",
    icon: FileText,
  },
];

export function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              FitManage
            </h2>
            <p className="text-sm text-gray-500">Personal Trainer</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full hover:bg-blue-50 ${
                      activeTab === item.id 
                        ? "bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600" 
                        : ""
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
