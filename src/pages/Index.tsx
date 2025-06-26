
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { Students } from "@/components/Students";
import { Classes } from "@/components/Classes";
import { Payments } from "@/components/Payments";
import { Performance } from "@/components/Performance";
import { Feedback } from "@/components/Feedback";
import { Reports } from "@/components/Reports";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "students":
        return <Students />;
      case "classes":
        return <Classes />;
      case "payments":
        return <Payments />;
      case "performance":
        return <Performance />;
      case "feedback":
        return <Feedback />;
      case "reports":
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-green-50">
        <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
