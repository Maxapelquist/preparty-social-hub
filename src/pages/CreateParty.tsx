import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Calendar, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Group {
  id: string;
  name: string;
}

export function CreateParty() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location_name: '',
    start_time: '',
    end_time: '',
    max_attendees: '',
    vibe: '',
    is_public: false,
    host_group_id: ''
  });

  const vibes = ['Energetic', 'Chill', 'Crazy', 'Intimate', 'Wild'];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserGroups();
  }, [user, navigate]);

  const fetchUserGroups = async () => {
    // For now, use mock data since groups table doesn't exist yet
    // In a real app, this would fetch actual groups from the database
    setGroups([]);
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Store coordinates for later use
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // For now, just update the location name
          setFormData(prev => ({
            ...prev,
            location_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          }));
          
          toast({
            title: "Plats tillagd",
            description: "Din nuvarande position har lagts till"
          });
        },
        (error) => {
          toast({
            variant: "destructive",
            title: "Kunde inte hämta plats",
            description: "Ange plats manuellt istället"
          });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.location_name.trim() || !formData.start_time) {
      toast({
        variant: "destructive",
        title: "Obligatoriska fält saknas",
        description: "Fyll i titel, plats och starttid"
      });
      return;
    }

    setLoading(true);

    try {
      // For now, we'll use default coordinates (Stockholm)
      const { error } = await supabase
        .from('parties')
        .insert({
          title: formData.title,
          description: formData.description,
          host_id: user!.id,
          location_name: formData.location_name,
          location_lat: 59.3293, // Stockholm default
          location_lng: 18.0686, // Stockholm default
          start_time: formData.start_time,
          end_time: formData.end_time || null,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
          vibe: formData.vibe || 'Energetic',
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Fest skapad!",
        description: `${formData.title} har skapats framgångsrikt.`
      });

      navigate('/parties');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte skapa fest",
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
            onClick={() => navigate('/parties')}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Skapa Fest
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Info */}
          <Card className="p-6 glass card-shadow">
            <h2 className="text-lg font-semibold mb-4">Grundläggande Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Festnamn</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="t.ex. Rooftop Vibes"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Beskrivning</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beskriv din fest..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Vibe</label>
                <Select value={formData.vibe} onValueChange={(value) => setFormData(prev => ({ ...prev, vibe: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj stämning" />
                  </SelectTrigger>
                  <SelectContent>
                    {vibes.map(vibe => (
                      <SelectItem key={vibe} value={vibe}>{vibe}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Location & Time */}
          <Card className="p-6 glass card-shadow">
            <h2 className="text-lg font-semibold mb-4">Plats & Tid</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Plats</label>
                <div className="flex space-x-2">
                  <Input
                    value={formData.location_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                    placeholder="Adress eller platsnamn"
                    required
                    className="flex-1"
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon"
                    onClick={requestLocation}
                  >
                    <MapPin size={16} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Starttid</label>
                  <Input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sluttid (valfritt)</label>
                  <Input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Attendees & Visibility */}
          <Card className="p-6 glass card-shadow">
            <h2 className="text-lg font-semibold mb-4">Deltagare & Synlighet</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Max antal deltagare (valfritt)</label>
                <Input
                  type="number"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_attendees: e.target.value }))}
                  placeholder="Lämna tom för obegränsat"
                  min="1"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Publik fest</label>
                  <p className="text-xs text-muted-foreground">
                    Synlig för alla i kartvyn
                  </p>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                />
              </div>
            </div>
          </Card>

          {/* Host Group Selection */}
          {groups.length > 0 && (
            <Card className="p-6 glass card-shadow">
              <h2 className="text-lg font-semibold mb-4">Värdgrupp</h2>
              <Select value={formData.host_group_id} onValueChange={(value) => setFormData(prev => ({ ...prev, host_group_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj värdgrupp (valfritt)" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full gradient-primary text-white button-shadow h-12"
            disabled={loading}
          >
            <Calendar size={18} className="mr-2" />
            {loading ? 'Skapar fest...' : 'Skapa fest'}
          </Button>

        </form>
      </div>
    </div>
  );
}