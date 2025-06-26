
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { Classes } from "@/components/Classes";
import { Students } from "@/components/Students";
import { Performance } from "@/components/Performance";
import { Reports } from "@/components/Reports";
import { Documents } from "@/components/Documents";
import { Communication } from "@/components/Communication";
import { Payments } from "@/components/Payments";
import { Feedback } from "@/components/Feedback";
import { useState } from "react";

export default function Index() {
  const [activeView, setActiveView] = useState("dashboard");

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center mb-6">
            <SidebarTrigger className="mr-4" />
          </div>
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
}
