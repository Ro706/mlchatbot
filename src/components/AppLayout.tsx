import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import {
  LayoutDashboard, MessageSquareWarning, PlusCircle, Network,
  FileText, Brain, LogOut, Shield, Activity, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/NotificationBell";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/complaints", label: "Complaints", icon: MessageSquareWarning },
  { to: "/admin/complaints/new", label: "Submit Complaint", icon: PlusCircle },
  { to: "/admin/clusters", label: "Clusters & RCA", icon: Brain },
  { to: "/admin/anomalies", label: "Anomaly Detection", icon: Activity },
  { to: "/admin/incident-commander", label: "Incident Commander", icon: Flame },
  { to: "/admin/knowledge-graph", label: "Knowledge Graph", icon: Network },
  { to: "/admin/intelligence", label: "Daily Intelligence", icon: FileText },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await signOut(); navigate("/"); };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col shrink-0">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">ACIP Admin</h2>
            <p className="text-[10px] text-muted-foreground">Complaint Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs text-muted-foreground">Alerts</span>
            <NotificationBell />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-secondary w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
