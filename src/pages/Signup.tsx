import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function Signup() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    displayName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const { toast } = useToast();
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username || !USERNAME_REGEX.test(username)) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Username check error:', error);
        setUsernameAvailable(null);
        return;
      }

      setUsernameAvailable(!data);
    } catch (error) {
      console.error('Username availability check failed:', error);
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setFormData(prev => ({ ...prev, username: value }));
    if (value) {
      const timeoutId = setTimeout(() => checkUsernameAvailability(value), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUsernameAvailable(null);
    }
  };

  const validateForm = () => {
    if (!formData.email || !formData.username || !formData.displayName || !formData.phoneNumber || !formData.password) {
      toast({
        title: "Fel",
        description: "Alla fält är obligatoriska",
        variant: "destructive",
      });
      return false;
    }

    if (!USERNAME_REGEX.test(formData.username)) {
      toast({
        title: "Ogiltigt användarnamn",
        description: "Användarnamnet måste vara 3-20 tecken långt och får endast innehålla bokstäver, siffror och understreck",
        variant: "destructive",
      });
      return false;
    }

    if (usernameAvailable === false) {
      toast({
        title: "Användarnamn upptaget",
        description: "Detta användarnamn är redan taget. Välj ett annat.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Svagt lösenord",
        description: "Lösenordet måste vara minst 6 tecken långt",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Lösenord matchar inte",
        description: "Lösenorden måste vara identiska",
        variant: "destructive",
      });
      return false;
    }

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
      toast({
        title: "Ogiltigt telefonnummer",
        description: "Ange ett giltigt telefonnummer",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await signUp(
        formData.email, 
        formData.password, 
        formData.displayName,
        formData.username,
        formData.phoneNumber
      );

      if (error) {
        if (error.message?.includes('User already registered')) {
          toast({
            title: "Användare finns redan",
            description: "Ett konto med denna e-postadress finns redan. Försök logga in istället.",
            variant: "destructive",
          });
        } else if (error.message?.includes('duplicate') || error.code === '23505') {
          toast({
            title: "Användare finns redan",
            description: "Ett konto med denna e-postadress eller telefonnummer finns redan.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registreringsfel",
            description: error.message || "Ett oväntat fel uppstod",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Konto skapat!",
          description: "Kontrollera din e-post för verifieringslänk",
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod vid registrering",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUsernameValidationMessage = () => {
    if (!formData.username) return null;
    if (!USERNAME_REGEX.test(formData.username)) {
      return "3-20 tecken, endast bokstäver, siffror och understreck";
    }
    if (usernameChecking) return "Kontrollerar tillgänglighet...";
    if (usernameAvailable === true) return "✓ Tillgängligt";
    if (usernameAvailable === false) return "✗ Upptaget";
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Skapa konto</CardTitle>
          <CardDescription className="text-center">
            Fyll i dina uppgifter för att komma igång med PreParty
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-postadress</Label>
              <Input
                id="email"
                type="email"
                placeholder="din@email.se"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Användarnamn</Label>
              <Input
                id="username"
                type="text"
                placeholder="mitt_användarnamn"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                required
              />
              {getUsernameValidationMessage() && (
                <p className={`text-sm ${
                  usernameAvailable === true ? 'text-green-600' : 
                  usernameAvailable === false ? 'text-red-600' : 
                  'text-muted-foreground'
                }`}>
                  {getUsernameValidationMessage()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Visningsnamn</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Ditt namn"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Telefonnummer</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+46 70 123 45 67"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minst 6 tecken"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Upprepa lösenordet"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || usernameChecking || usernameAvailable === false}
            >
              {loading ? "Skapar konto..." : "Skapa konto"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Har du redan ett konto?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Logga in här
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}