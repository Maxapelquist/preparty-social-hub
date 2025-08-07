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

const INTERESTS = [
  "Musik", "Sport", "Film", "Konst", "Resor", "Mat", "Gaming", 
  "Foto", "Dans", "Läsning", "Programmering", "Design", "Mode",
  "Träning", "Festande", "Naturens", "Djur", "Teknik"
];

export function EditProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    age: '',
    bio: '',
    university: '',
    interests: [] as string[]
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, age, bio, university, interests')
      .eq('user_id', user!.id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Kunde inte ladda profil",
        description: error.message
      });
    } else if (data) {
      setFormData({
        display_name: data.display_name || '',
        age: data.age?.toString() || '',
        bio: data.bio || '',
        university: data.university || '',
        interests: data.interests || []
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          age: formData.age ? parseInt(formData.age) : null,
          bio: formData.bio,
          university: formData.university,
          interests: formData.interests
        })
        .eq('user_id', user!.id);

      if (error) throw error;

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

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="glass"
            onClick={() => navigate('/profile')}
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