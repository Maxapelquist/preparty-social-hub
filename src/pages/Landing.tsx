import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      if (loading) return;
      
      if (!user) {
        // No user - redirect to signup page
        navigate("/signup");
        return;
      }

      // User is authenticated - check if they have completed onboarding
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, age, occupation')
          .eq('user_id', user.id)
          .single();
        
        // If user doesn't have a complete profile, redirect to profile page (which will show onboarding)
        if (error || !data?.display_name || !data?.age || !data?.occupation) {
          navigate('/profile');
        } else {
          // User has completed onboarding, redirect to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // On error, assume they need onboarding and go to profile
        navigate('/profile');
      }
    };

    handleRedirect();
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Laddar...</p>
      </div>
    </div>
  );
}