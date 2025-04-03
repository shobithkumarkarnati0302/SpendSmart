
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import Footer from "./Footer";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  if (!user) {
    return <Navigate to="/auth" />;
  }

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarVisible(!sidebarVisible);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div
        className={cn(
          "fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out lg:sticky",
          sidebarCollapsed && !isMobile ? "w-[80px]" : "w-[250px]",
          isMobile ? (sidebarVisible ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
        )}
      >
        <Sidebar 
          collapsed={sidebarCollapsed} 
          toggle={toggleSidebar} 
        />
      </div>
      
      <div className={cn(
        "flex flex-col flex-1 w-full transition-all duration-300",
        !isMobile && (sidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[250px]"),
      )}>
        {isMobile && (
          <div className="sticky top-0 z-20 flex items-center h-16 px-4 border-b bg-background">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <div className="ml-4 text-lg font-semibold">Spend Smart</div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AppLayout;
