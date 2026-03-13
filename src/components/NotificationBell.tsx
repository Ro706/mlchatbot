import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  complaint_id: string | null;
  is_read: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${BASE_URL}/api/notifications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // In a real Flask app, you might use WebSockets (Socket.IO) or SSE for realtime
    // For now, let's just poll or rely on manual refresh/events
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0 || !token) return;

    try {
      await Promise.all(unreadIds.map(id => 
        fetch(`${BASE_URL}/api/notifications/${id}/read`, {
          method: "PATCH",
          headers: { "Authorization": `Bearer ${token}` }
        })
      ));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error("Failed to mark read", e);
    }
  };

  const typeColor: Record<string, string> = {
    critical: "bg-destructive/20 text-destructive",
    warning: "bg-warning/20 text-warning",
    info: "bg-primary/20 text-primary",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-md hover:bg-secondary transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">No notifications</p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3 border-b border-border last:border-0 ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium mt-0.5 ${typeColor[n.type] || typeColor.info}`}>
                    {n.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                      {n.complaint_id && (
                        <Link
                          to={`/admin/complaints/${n.complaint_id}`}
                          className="text-[10px] text-primary hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
