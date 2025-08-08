import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const INTERESTS = [
  'Musik', 'Gaming', 'Mat', 'Träning', 'Foto', 'Resor', 
  'Film', 'Böcker', 'Dans', 'Konst', 'Sport', 'Tech'
];

export default function Onboarding({ canSkip = false }: { canSkip?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  
  const [formData, setFormData] = useState({
    age: '',
    bio: '',
    occupation: '',
    interests: [] as string[],
    locationLat: null as number | null,
    locationLng: null as number | null,
    locationName: ''
  });

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Plats ej tillgänglig",
        description: "Din webbläsare stöder inte platstjänster. Du kan hoppa över detta steg."
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          locationLat: position.coords.latitude,
          locationLng: position.coords.longitude,
          locationName: "Din aktuella plats"
        }));
        setLocationEnabled(true);
        setLoading(false);
        toast({
          title: "Plats aktiverad!",
          description: "Vi kan nu visa fester nära dig"
        });
      },
      (error) => {
        setLoading(false);
        let errorMessage = "Kunde inte hämta din plats. ";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Du nekade platsåtkomst. Du kan aktivera det senare i inställningar.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Platsinformation är inte tillgänglig.";
            break;
          case error.TIMEOUT:
            errorMessage += "Förfrågan om plats tog för lång tid.";
            break;
          default:
            errorMessage += "Ett okänt fel uppstod.";
            break;
        }
        
        toast({
          variant: "destructive",
          title: "Platsproblem",
          description: errorMessage
        });
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 300000
      }
    );
  };

  const skipLocation = () => {
    setLocationEnabled(false);
    toast({
      title: "Plats hoppades över",
      description: "Du kan aktivera plats senare i dina inställningar"
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Autentiseringsfel",
        description: "Du är inte inloggad. Vänligen uppdatera sidan."
      });
      return;
    }

    // Validering - ålder och sysselsättning är obligatoriska
    if (!formData.age || !formData.occupation) {
      toast({
        variant: "destructive",
        title: "Fyll i alla obligatoriska fält",
        description: "Ålder och sysselsättning måste fyllas i."
      });
      return;
    }

    setLoading(true);
    
    try {
      // Refresh session before making the request to ensure it's valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        throw new Error('Sessionen har löpt ut. Vänligen uppdatera sidan och logga in igen.');
      }

      console.log('Making profile update request for user:', user.id);
      
      // Use the new simpler function - just update the missing fields
      const { data, error } = await supabase.rpc('upsert_profile_simple', {
        p_display_name: null, // Keep existing from signup
        p_username: null, // Keep existing from signup  
        p_age: parseInt(formData.age) || null,
        p_bio: formData.bio || null,
        p_university: null, // Not collected anymore
        p_occupation: formData.occupation || null,
        p_phone_number: null, // Keep existing from signup
        p_interests: formData.interests.length > 0 ? formData.interests : null,
        p_location_lat: formData.locationLat,
        p_location_lng: formData.locationLng,
        p_location_name: formData.locationName || null
      });

      if (error) {
        console.error('Profile update error:', error);
        
        // Handle specific error types
        if (error.message?.includes('User not authenticated')) {
          throw new Error('Du är inte inloggad. Vänligen logga in igen.');
        } else if (error.message?.includes('Authentication session expired')) {
          throw new Error('Sessionen har löpt ut. Vänligen uppdatera sidan och försök igen.');
        } else if (error.message?.includes('User does not exist in auth system')) {
          throw new Error('Autentiseringsfel. Vänligen logga ut och in igen.');
        } else {
          throw new Error('Kunde inte uppdatera profil. Försök igen.');
        }
      }

      console.log('Profile updated successfully:', data);
      
      toast({
        title: "Profil skapad!",
        description: "Välkommen till PreParty!"
      });
      
      // Use window.location to ensure clean navigation
      window.location.href = '/dashboard';
      
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        variant: "destructive",
        title: "Fel vid profilering",
        description: error.message || "Ett oväntat fel uppstod. Försök igen."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast({
      title: "Onboarding hoppades över",
      description: "Du kan slutföra din profil senare"
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 gradient-hero opacity-20" />
      
      <Card className="w-full max-w-lg p-8 glass card-shadow relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
              Slutför din profil
            </h1>
            <p className="text-muted-foreground mt-2">
              Berätta lite mer om dig själv
            </p>
          </div>
          {canSkip && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Hoppa över
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Ålder */}
          <div className="space-y-2">
            <Label htmlFor="age">Ålder *</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="glass"
              placeholder="20"
              required
            />
          </div>

          {/* Sysselsättning */}
          <div className="space-y-2">
            <Label htmlFor="occupation">Sysselsättning (Skola eller jobb) *</Label>
            <Input
              id="occupation"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="glass"
              placeholder="t.ex. Student KTH, Utvecklare på Spotify, Gymnasieelev"
              required
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="glass resize-none"
              placeholder="Berätta lite om dig själv..."
              rows={3}
            />
          </div>

          {/* Intressen */}
          <div className="space-y-4">
            <div>
              <Label>Intressen (valfritt)</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Välj vad du gillar för att hitta likasinnade
              </p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <Badge
                    key={interest}
                    variant={formData.interests.includes(interest) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      formData.interests.includes(interest) 
                        ? "gradient-primary text-white" 
                        : "hover:border-primary"
                    }`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Plats */}
          <div className="space-y-4">
            <div className="p-6 glass rounded-lg text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Aktivera Plats (Valfritt)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Hitta fester nära dig
              </p>
              
              {locationEnabled ? (
                <div className="flex items-center justify-center space-x-2 text-green-500">
                  <CheckCircle size={20} />
                  <span>Plats aktiverad!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button 
                    onClick={requestLocation}
                    disabled={loading}
                    variant="outline"
                    className="glass w-full"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4 mr-2" />
                    )}
                    Aktivera Plats
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    onClick={skipLocation}
                    className="w-full text-xs"
                  >
                    Hoppa över för nu
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.age || !formData.occupation}
            className="gradient-primary text-white button-shadow w-full"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Slutför Profil
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          * Obligatoriska fält
        </p>
      </Card>
    </div>
  );
}