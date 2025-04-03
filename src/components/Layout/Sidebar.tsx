
import { CircleDollarSign, CreditCard, Home, LogOut, PieChart, Settings, User, Wallet } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SidebarProps {
  collapsed: boolean;
  toggle: () => void;
}

interface Profile {
  full_name: string;
  email: string;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggle }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  const sidebarItems = [
    { name: "Dashboard", path: "/", icon: <Home className="h-5 w-5" /> },
    { name: "Expenses", path: "/expenses", icon: <CreditCard className="h-5 w-5" /> },
    { name: "Budgets", path: "/budgets", icon: <Wallet className="h-5 w-5" /> },
    { name: "Reports", path: "/reports", icon: <PieChart className="h-5 w-5" /> },
    { name: "Settings", path: "/settings", icon: <Settings className="h-5 w-5" /> },
  ];

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (data) {
          setProfile(data);
        }
      }
    };

    fetchProfile();
    
    // Subscribe to profile changes
    const profileSubscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user?.id}` }, 
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [user]);

  if (isMobile) {
    return (
      <div className="fixed z-50 w-full h-full bg-sidebar overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <CircleDollarSign size={26} className="text-primary" />
            <span className="font-bold text-xl whitespace-nowrap">Spend Smart</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggle}>
            <User className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={toggle}
              className={cn(
                "flex items-center gap-3 p-3 rounded-md transition-colors mb-1",
                location.pathname === item.path
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        <div className="p-4 mt-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <User size={18} className="text-primary-foreground" />
            </div>
            <div className="flex flex-col text-sm">
              <span className="font-semibold">
                {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User"}
              </span>
              <span className="text-xs text-gray-400">
                {user?.email || ""}
              </span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-sidebar text-sidebar-foreground h-screen flex flex-col transition-all duration-300",
        collapsed ? "w-[70px]" : "w-[250px]"
      )}
    >
      <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
        <CircleDollarSign size={30} className="text-primary" />
        {!collapsed && (
          <span className="font-bold text-xl whitespace-nowrap">Spend Smart</span>
        )}
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto p-2">
        {sidebarItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 p-3 mt-5 rounded-md transition-colors",
              location.pathname === item.path
                ? "bg-sidebar-accent text-sidebar-primary"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            {item.icon}
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User size={18} className="text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col text-sm">
              <span className="font-semibold">
                {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User"}
              </span>
              <span className="text-xs text-gray-400">
                {user?.email || ""}
              </span>
            </div>
          )}
        </div>
        
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2 text-black"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
          {collapsed && <span className="absolute opacity-0 group-hover:opacity-100">Sign Out</span>}
        </Button>
      </div>

      <button
        onClick={toggle}
        className="absolute top-5 -right-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-all"
      >
        {collapsed ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <polyline points="13 17 18 12 13 7"></polyline>
            <polyline points="6 17 11 12 6 7"></polyline>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <polyline points="11 17 6 12 11 7"></polyline>
            <polyline points="18 17 13 12 18 7"></polyline>
          </svg>
        )}
      </button>
    </div>
  );
};

export default Sidebar;
