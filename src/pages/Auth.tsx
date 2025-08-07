import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signUp(formData.email, formData.password, formData.displayName);
      }

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Fel",
          description: result.error.message
        });
      } else if (!isLogin) {
        toast({
          title: "Konto skapat!",
          description: "Kontrollera din e-post för verifieringslänken."
        });
      } else {
        // Successfully logged in, redirect will happen via useEffect
        toast({
          title: "Inloggning lyckades!",
          description: "Välkommen tillbaka!"
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Något gick fel",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 gradient-hero opacity-20" />
      
      <Card className="w-full max-w-md p-8 glass card-shadow relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            PreParty
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? 'Logga in på ditt konto' : 'Skapa ditt konto'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Visningsnamn</Label>
              <Input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required={!isLogin}
                className="glass"
                placeholder="Ditt namn"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="glass"
              placeholder="din@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Lösenord</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="glass pr-10"
                placeholder="Ditt lösenord"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full gradient-primary text-white button-shadow h-12"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLogin ? 'Logga in' : 'Skapa konto'}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-muted-foreground">
            {isLogin ? 'Har du inget konto?' : 'Har du redan ett konto?'}
          </p>
          <Button
            variant="ghost"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-primary-glow"
          >
            {isLogin ? 'Skapa konto' : 'Logga in'}
          </Button>
        </div>
      </Card>
    </div>
  );
}