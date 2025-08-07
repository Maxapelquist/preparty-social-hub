import { useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { GroupsView } from "@/components/groups/GroupsView";
import { PartiesView } from "@/components/parties/PartiesView";
import { ChatView } from "@/components/chat/ChatView";
import { GamesView } from "@/components/games/GamesView";

const Index = () => {
  const [activeTab, setActiveTab] = useState("profile");

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
