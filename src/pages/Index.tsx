
import { Dashboard } from "@/components/Dashboard";
import { Classes } from "@/components/Classes";
import { Students } from "@/components/Students";
import { Performance } from "@/components/Performance";
import { Reports } from "@/components/Reports";
import { Documents } from "@/components/Documents";
import { Communication } from "@/components/Communication";
import { Payments } from "@/components/Payments";
import { Feedback } from "@/components/Feedback";
import { CheckIn } from "@/components/CheckIn";
import { Workouts } from "@/components/Workouts";
import { Plans } from "@/components/Plans";
import { Equipment } from "@/components/Equipment";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { useState } from "react";

export default function Index() {
  const [activeView, setActiveView] = useState("dashboard");

  const getViewConfig = (view: string) => {
    const configs = {
      dashboard: { title: "Dashboard", subtitle: "Visão geral do seu negócio" },
      checkin: { title: "Check-in", subtitle: "Controle de acesso à academia" },
      classes: { title: "Aulas", subtitle: "Gerencie suas aulas e horários" },
      students: { title: "Alunos", subtitle: "Gerencie seus alunos" },
      workouts: { title: "Treinos", subtitle: "Sistema de treinos e exercícios" },
      performance: { title: "Performance", subtitle: "Acompanhe o progresso dos alunos" },
      plans: { title: "Planos", subtitle: "Gerencie planos e mensalidades" },
      equipment: { title: "Equipamentos", subtitle: "Controle e manutenção dos equipamentos" },
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
      case "checkin":
        return <CheckIn />;
      case "classes":
        return <Classes />;
      case "students":
        return <Students />;
      case "workouts":
        return <Workouts />;
      case "performance":
        return <Performance />;
      case "plans":
        return <Plans />;
      case "equipment":
        return <Equipment />;
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
