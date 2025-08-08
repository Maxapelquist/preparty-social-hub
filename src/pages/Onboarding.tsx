import { useState, useEffect } from 'react';
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

const USERNAME_REGEX = /^[a-z0-9_.]{3,20}$/;

export default function Onboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    age: '',
    bio: '',
    university: '',
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
      // Om api-fel, tillåt fortsättning men visa info
      setUsernameError('Kunde inte verifiera just nu. Försök igen eller fortsätt.');
      return true;
    }
    if (data && data.user_id !== user?.id) {
      setUsernameError('Användarnamnet är upptaget');
      return false;
    }
    setUsernameError(null);
    return true;
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
    if (!user) return;
    
    // Validera användarnamn en sista gång innan submit
    const ok = await checkUsernameAvailability(formData.username);
    if (!ok) {
      toast({
        variant: "destructive",
        title: "Ogiltigt användarnamn",
        description: usernameError || "Kontrollera användarnamnet"
      });
      return;
    }

    setLoading(true);
    try {
      // Use the safe upsert function that checks auth.users existence
      const { data, error } = await supabase.rpc('upsert_profile', {
        p_user_id: user.id,
        p_display_name: formData.displayName,
        p_username: formData.username.trim().toLowerCase(),
        p_age: parseInt(formData.age) || null,
        p_bio: formData.bio || null,
        p_university: formData.university || null,
        p_occupation: formData.occupation || null,
        p_phone_number: null, // Phone number handled during signup
        p_interests: formData.interests.length > 0 ? formData.interests : null,
        p_location_lat: formData.locationLat,
        p_location_lng: formData.locationLng,
        p_location_name: formData.locationName || null
      });

      if (error) {
        console.error('Profile creation error:', error);
        
        // Handle specific error types
        if (error.message?.includes('User not authenticated')) {
          throw new Error('Du är inte inloggad. Vänligen logga in igen.');
        } else if (error.message?.includes('Authentication session expired')) {
          throw new Error('Sessionen har löpt ut. Vänligen uppdatera sidan och försök igen.');
        } else if (error.message?.includes('User does not exist in auth system')) {
          throw new Error('Autentiseringsfel. Vänligen logga ut och in igen.');
        } else if (error.message?.includes('duplicate key') || error.code === '23505') {
          throw new Error('Användarnamnet är upptaget. Välj ett annat.');
        } else {
          throw new Error('Kunde inte skapa profil. Försök igen.');
        }
      }

      toast({
        title: "Profil skapad!",
        description: "Välkommen till PreParty!"
      });
      
      navigate('/dashboard');
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

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 gradient-hero opacity-20" />
      
      <Card className="w-full max-w-lg p-8 glass card-shadow relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            Välkommen!
          </h1>
          <p className="text-muted-foreground mt-2">
            Låt oss skapa din profil (steg {step} av 3)
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Visningsnamn</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="glass"
                placeholder="Ditt namn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Användarnamn</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                onBlur={() => checkUsernameAvailability(formData.username)}
                className="glass"
                placeholder="t.ex. alex_89"
              />
              {checkingUsername && (
                <p className="text-xs text-muted-foreground">Kontrollerar tillgänglighet...</p>
              )}
              {usernameError && (
                <p className="text-xs text-destructive">{usernameError}</p>
              )}
              {!usernameError && formData.username && !checkingUsername && (
                <p className="text-xs text-green-600">Tillgängligt</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Ålder</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="glass"
                placeholder="20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="university">Universitet/Skola</Label>
              <Input
                id="university"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                className="glass"
                placeholder="KTH, SU, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Yrke/Sysselsättning</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="glass"
                placeholder="Student, Utvecklare, etc."
              />
            </div>

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
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label>Intressen</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Välj vad du gillar (välj minst 3)
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
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="p-6 glass rounded-lg">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Aktivera Plats (Valfritt)</h3>
              <p className="text-muted-foreground mb-4">
                Låt oss hitta fester nära dig för den bästa upplevelsen
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
                    className="gradient-primary text-white button-shadow w-full"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4 mr-2" />
                    )}
                    Aktivera Plats
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={skipLocation}
                    className="glass w-full"
                  >
                    Hoppa över för nu
                  </Button>
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              Du kan alltid aktivera plats senare i dina inställningar
            </p>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 && (
            <Button variant="outline" onClick={prevStep} className="glass">
              Tillbaka
            </Button>
          )}
          
          <div className="ml-auto">
            {step < 3 ? (
              <Button 
                onClick={nextStep}
                disabled={
                  (step === 1 && (!formData.displayName || !formData.username || !formData.age || !formData.occupation || !!usernameError)) ||
                  (step === 2 && formData.interests.length < 3)
                }
                className="gradient-primary text-white button-shadow"
              >
                Nästa
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={loading || !formData.displayName || !formData.username || !formData.age || !formData.occupation || !!usernameError || formData.interests.length < 3}
                className="gradient-primary text-white button-shadow"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Slutför
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
