
import { Dashboard } from "@/components/Dashboard";
import { Classes } from "@/components/Classes";
import { Students } from "@/components/Students";
import { Performance } from "@/components/Performance";
import { Reports } from "@/components/Reports";
import { Documents } from "@/components/Documents";
import { Communication } from "@/components/Communication";
import { Payments } from "@/components/Payments";
import { Feedback } from "@/components/Feedback";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { useState } from "react";

export default function Index() {
  const [activeView, setActiveView] = useState("dashboard");

  const getViewConfig = (view: string) => {
    const configs = {
      dashboard: { title: "Dashboard", subtitle: "Visão geral do seu negócio" },
      classes: { title: "Aulas", subtitle: "Gerencie suas aulas e horários" },
      students: { title: "Alunos", subtitle: "Gerencie seus alunos" },
      performance: { title: "Performance", subtitle: "Acompanhe o progresso dos alunos" },
      reports: { title: "Relatórios", subtitle: "Analytics e insights" },
      documents: { title: "Documentos", subtitle: "Gerencie documentos importantes" },
      communication: { title: "Comunicação", subtitle: "Messages e notificações" },
      payments: { title: "Pagamentos", subtitle: "Controle financeiro" },
      feedback: { title: "Feedback", subtitle: "Avaliações dos alunos" },
    };
    return configs[view as keyof typeof configs] || { title: "Dashboard", subtitle: "Visão geral" };
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />;
      case "classes":
        return <Classes />;
      case "students":
        return <Students />;
      case "performance":
        return <Performance />;
      case "reports":
        return <Reports />;
      case "documents":
        return <Documents />;
      case "communication":
        return <Communication />;
      case "payments":
        return <Payments />;
      case "feedback":
        return <Feedback />;
      default:
        return <Dashboard />;
    }
  };

  const viewConfig = getViewConfig(activeView);

  return (
    <ResponsiveLayout
      activeView={activeView}
      onViewChange={setActiveView}
      title={viewConfig.title}
      subtitle={viewConfig.subtitle}
    >
      {renderContent()}
    </ResponsiveLayout>
  );
}
