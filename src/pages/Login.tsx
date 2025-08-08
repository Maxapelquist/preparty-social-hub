import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const { toast } = useToast();
  const { signIn, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          toast({
            title: "Inloggningsfel",
            description: "Felaktig e-postadress eller lösenord",
            variant: "destructive",
          });
        } else if (error.message?.includes('Email not confirmed')) {
          toast({
            title: "E-post ej bekräftad",
            description: "Kontrollera din e-post och klicka på bekräftelselänken",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Inloggningsfel",
            description: error.message || "Ett oväntat fel uppstod",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Välkommen tillbaka!",
          description: "Du är nu inloggad",
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod vid inloggning",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: "E-postadress krävs",
        description: "Ange din e-postadress för att återställa lösenordet",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await resetPassword(resetEmail);
      
      if (error) {
        toast({
          title: "Fel",
          description: error.message || "Kunde inte skicka återställningslänk",
          variant: "destructive",
        });
      } else {
        toast({
          title: "E-post skickad",
          description: "Kontrollera din e-post för återställningslänk",
        });
        setShowResetPassword(false);
        setResetEmail("");
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Återställ lösenord</CardTitle>
            <CardDescription className="text-center">
              Ange din e-postadress så skickar vi dig en återställningslänk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">E-postadress</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="din@email.se"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? "Skickar..." : "Skicka återställningslänk"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => setShowResetPassword(false)}
                className="text-sm"
              >
                Tillbaka till inloggning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Logga in</CardTitle>
          <CardDescription className="text-center">
            Välkommen tillbaka till PreParty
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
              <Label htmlFor="password">Lösenord</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ditt lösenord"
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

            <div className="text-right">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowResetPassword(true)}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Glömt lösenord?
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loggar in..." : "Logga in"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Har du inget konto?{" "}
              <Link to="/" className="text-primary hover:underline">
                Skapa konto här
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}