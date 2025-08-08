import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import EditProfile from "./pages/EditProfile";
import CreateGroup from "./pages/CreateGroup";
import CreateParty from "./pages/CreateParty";
import FindFriends from "./pages/FindFriends";
import FriendProfile from "./pages/FriendProfile";
import { DirectChat } from "./components/chat/DirectChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/profile" element={<Index />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/groups" element={<Index />} />
            <Route path="/groups/create" element={<CreateGroup />} />
            <Route path="/parties" element={<Index />} />
            <Route path="/parties/create" element={<CreateParty />} />
            <Route path="/friends" element={<FindFriends />} />
            <Route path="/profile/:userId" element={<FriendProfile />} />
            <Route path="/chat" element={<Index />} />
            <Route path="/chat/:conversationId" element={<DirectChat />} />
            <Route path="/map" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
