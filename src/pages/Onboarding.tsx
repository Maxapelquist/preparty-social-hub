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
        title: "Fel",
        description: "Din webbläsare stöder inte geolocation"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          locationLat: position.coords.latitude,
          locationLng: position.coords.longitude,
          locationName: "Din aktuella plats"
        }));
        setLocationEnabled(true);
        toast({
          title: "Plats aktiverad!",
          description: "Vi kan nu visa fester nära dig"
        });
      },
      (error) => {
        toast({
          variant: "destructive",
          title: "Kunde inte hämta plats",
          description: "Vänligen tillåt platsåtkomst för att få bästa upplevelsen"
        });
      }
    );
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
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: formData.displayName,
          username: formData.username.trim().toLowerCase(),
          age: parseInt(formData.age),
          bio: formData.bio,
          university: formData.university,
          interests: formData.interests,
          location_lat: formData.locationLat,
          location_lng: formData.locationLng,
          location_name: formData.locationName
        });

      if (error) {
        // Hantera unikhetsfel snyggt
        const isUnique = (error as any)?.code === '23505' || (error as any)?.message?.toLowerCase()?.includes('duplicate key');
        if (isUnique) {
          throw new Error('Användarnamnet är upptaget. Välj ett annat.');
        }
        throw error;
      }

      toast({
        title: "Profil skapad!",
        description: "Välkommen till PreParty!"
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fel",
        description: error.message
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
              <h3 className="text-xl font-semibold mb-2">Aktivera Plats</h3>
              <p className="text-muted-foreground mb-4">
                Låt oss hitta fester nära dig för den bästa upplevelsen
              </p>
              
              {locationEnabled ? (
                <div className="flex items-center justify-center space-x-2 text-green-500">
                  <CheckCircle size={20} />
                  <span>Plats aktiverad!</span>
                </div>
              ) : (
                <Button 
                  onClick={requestLocation}
                  className="gradient-primary text-white button-shadow"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Aktivera Plats
                </Button>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              Du kan alltid ändra detta senare i dina inställningar
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
                disabled={step === 1 && (!formData.displayName || !formData.username || !!usernameError)}
                className="gradient-primary text-white button-shadow"
              >
                Nästa
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={loading || !formData.displayName || !formData.username || !!usernameError}
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
