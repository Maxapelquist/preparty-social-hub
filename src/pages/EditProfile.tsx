import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfilePictureUpload } from "@/components/profile/ProfilePictureUpload";

const INTERESTS = [
  "Musik", "Sport", "Film", "Konst", "Resor", "Mat", "Gaming", 
  "Foto", "Dans", "Läsning", "Programmering", "Design", "Mode",
  "Träning", "Festande", "Naturens", "Djur", "Teknik"
];

const USERNAME_REGEX = /^[a-z0-9_.]{3,20}$/;

function EditProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    age: '',
    bio: '',
    university: '',
    interests: [] as string[],
    profilePictures: [] as string[]
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, username, age, bio, university, interests, profile_pictures')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        toast({
          variant: "destructive",
          title: "Kunde inte ladda profil",
          description: error.message
        });
      } else if (data) {
        setFormData({
          display_name: data.display_name || '',
          username: data.username || '',
          age: data.age?.toString() || '',
          bio: data.bio || '',
          university: data.university || '',
          interests: data.interests || [],
          profilePictures: data.profile_pictures || []
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Fel",
        description: "Kunde inte ladda profil"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const checkUsernameAvailability = async (username: string) => {
    const candidate = username.trim().toLowerCase();
    if (!candidate) {
      setUsernameError('Ange ett användarnamn');
      return false;
    }
    if (!USERNAME_REGEX.test(candidate)) {
      setUsernameError('Endast a–z, 0–9, _ och . (3–20 tecken)');
      return false;
    }
    setCheckingUsername(true);
    setUsernameError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', candidate)
      .maybeSingle();
    setCheckingUsername(false);

    if (error) {
      setUsernameError('Kunde inte verifiera just nu.');
      return true;
    }
    if (data && data.user_id !== user?.id) {
      setUsernameError('Användarnamnet är upptaget');
      return false;
    }
    setUsernameError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // validera användarnamn innan uppdatering
    const ok = await checkUsernameAvailability(formData.username);
    if (!ok) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Ogiltigt användarnamn",
        description: usernameError || "Kontrollera användarnamnet"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          username: formData.username.trim().toLowerCase(),
          age: formData.age ? parseInt(formData.age) : null,
          bio: formData.bio,
          university: formData.university,
          interests: formData.interests,
          profile_pictures: formData.profilePictures,
          avatar_url: formData.profilePictures.length > 0 ? formData.profilePictures[0] : null
        })
        .eq('user_id', user!.id);

      if (error) {
        const isUnique = (error as any)?.code === '23505' || (error as any)?.message?.toLowerCase()?.includes('duplicate key');
        if (isUnique) {
          throw new Error('Användarnamnet är upptaget. Välj ett annat.');
        }
        throw error;
      }

      toast({
        title: "Profil uppdaterad!",
        description: "Dina ändringar har sparats."
      });

      navigate('/profile');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte spara profil",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-8">
        <div className="max-w-md mx-auto text-center pt-20">
          <p className="text-muted-foreground">Du måste vara inloggad för att redigera din profil</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/auth')}
          >
            Logga in
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-8">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="glass"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Redigera Profil
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Info */}
          <Card className="p-6 glass card-shadow">
            <h2 className="text-lg font-semibold mb-4">Grundläggande Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Namn</label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Ditt namn"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Användarnamn</label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                  onBlur={() => checkUsernameAvailability(formData.username)}
                  placeholder="t.ex. alex_89"
                  required
                />
                {checkingUsername && (
                  <p className="text-xs text-muted-foreground mt-1">Kontrollerar tillgänglighet...</p>
                )}
                {usernameError && (
                  <p className="text-xs text-destructive mt-1">{usernameError}</p>
                )}
                {!usernameError && formData.username && !checkingUsername && (
                  <p className="text-xs text-green-600 mt-1">Tillgängligt</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ålder</label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="Din ålder"
                  min="18"
                  max="100"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Universitet/Arbete</label>
                <Input
                  value={formData.university}
                  onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                  placeholder="KTH, Stockholms Universitet, etc."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Bio</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Berätta lite om dig själv..."
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Interests */}
          <Card className="p-6 glass card-shadow">
            <h2 className="text-lg font-semibold mb-4">Intressen</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Välj dina intressen för att hitta likasinnade
            </p>
            
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <Badge
                  key={interest}
                  variant={formData.interests.includes(interest) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    formData.interests.includes(interest)
                      ? 'gradient-primary text-white'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                  {formData.interests.includes(interest) && (
                    <X size={14} className="ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Profile Pictures */}
          <Card className="p-6 glass card-shadow">
            <ProfilePictureUpload
              currentPictures={formData.profilePictures}
              onPicturesChange={(pictures) => 
                setFormData(prev => ({ ...prev, profilePictures: pictures }))
              }
              maxPictures={5}
            />
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full gradient-primary text-white button-shadow h-12"
            disabled={loading}
          >
            <Save size={18} className="mr-2" />
            {loading ? 'Sparar...' : 'Spara Ändringar'}
          </Button>

        </form>
      </div>
    </div>
  );
}

export default EditProfile;
