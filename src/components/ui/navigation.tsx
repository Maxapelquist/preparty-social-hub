import { cn } from "@/lib/utils";
import { Home, Users, MapPin, MessageCircle, Gamepad2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "./badge";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  { id: "profile", label: "Profil", icon: Home },
  { id: "groups", label: "Vänner", icon: Users },
  { id: "parties", label: "Fester", icon: MapPin },
  { id: "chat", label: "Chatt", icon: MessageCircle },
  { id: "games", label: "Lekar", icon: Gamepad2 },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { counts } = useNotifications();

  const getNotificationCount = (tabId: string) => {
    switch (tabId) {
      case 'groups': return counts.groups;
      case 'chat': return counts.chat;
      case 'parties': return counts.parties;
      default: return 0;
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around px-4 py-2 max-w-md mx-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const notificationCount = getNotificationCount(item.id);
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300",
                "min-w-[60px] relative group",
                isActive 
                  ? "gradient-primary text-white shadow-lg" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "relative",
                isActive && "animate-pulse-glow"
              )}>
                <Icon size={20} className="mb-1" />
                {isActive && (
                  <div className="absolute inset-0 bg-primary-glow/20 rounded-full blur-md" />
                )}
                {notificationCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center p-0 text-xs font-bold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}