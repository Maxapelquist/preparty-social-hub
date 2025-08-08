import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { GroupsView } from "@/components/groups/GroupsView";
import { PartiesView } from "@/components/parties/PartiesView";
import { ChatView } from "@/components/chat/ChatView";
import { GamesView } from "@/components/games/GamesView";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/');
      return;
    }

    // Check if user has completed onboarding
    const checkProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, age, occupation')
        .eq('user_id', user.id)
        .single();
      
      // If user doesn't have a complete profile (missing age or occupation), redirect to onboarding
      if (error || !data?.display_name || !data?.age || !data?.occupation) {
        navigate('/onboarding');
      } else {
        setHasProfile(true);
      }
    };

    checkProfile();
  }, [user, loading, navigate]);

  if (loading || hasProfile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileView />;
      case "groups":
        return <GroupsView />;
      case "parties":
        return <PartiesView />;
      case "chat":
        return <ChatView />;
      case "games":
        return <GamesView />;
      default:
        return <ProfileView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderActiveView()}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
