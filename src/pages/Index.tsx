import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const { tab } = useParams();
  const activeTab = tab || "profile";
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
      if (error || !data?.age || !data?.occupation) {
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

  const handleTabChange = (newTab: string) => {
    if (newTab === "profile") {
      navigate("/dashboard");
    } else {
      navigate(`/dashboard/${newTab}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderActiveView()}
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
