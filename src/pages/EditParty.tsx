import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Trash2, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Party {
  id: string;
  title: string;
  description: string;
  host_id: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  start_time: string;
  end_time: string;
  max_attendees: number | null;
  vibe: string;
  is_public: boolean;
  group_id: string | null;
}

interface Group {
  id: string;
  name: string;
}

function EditParty() {
  const navigate = useNavigate();
  const { partyId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [party, setParty] = useState<Party | null>(null);
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
    group_id: ''
  });

  const vibes = ['Energetic', 'Chill', 'Crazy', 'Intimate', 'Wild'];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!partyId) {
      navigate('/parties');
      return;
    }
    fetchParty();
    fetchUserGroups();
  }, [user, partyId, navigate]);

  const fetchParty = async () => {
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .eq('id', partyId!)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          variant: "destructive",
          title: "Fest inte hittad",
          description: "Festen finns inte eller har tagits bort"
        });
        navigate('/parties');
        return;
      }

      if (data.host_id !== user!.id) {
        toast({
          variant: "destructive",
          title: "Åtkomst nekad",
          description: "Du kan bara redigera fester som du har skapat"
        });
        navigate('/parties');
        return;
      }

      setParty(data);
      setFormData({
        title: data.title,
        description: data.description || '',
        location_name: data.location_name,
        start_time: new Date(data.start_time).toISOString().slice(0, 16),
        end_time: data.end_time ? new Date(data.end_time).toISOString().slice(0, 16) : '',
        max_attendees: data.max_attendees ? data.max_attendees.toString() : '',
        vibe: data.vibe,
        is_public: data.is_public,
        group_id: data.group_id || ''
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte ladda fest",
        description: error.message
      });
      navigate('/parties');
    }
  };

  const fetchUserGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .eq('admin_id', user?.id);
      
      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    }
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setFormData(prev => ({
            ...prev,
            location_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          }));
          
          toast({
            title: "Plats uppdaterad",
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
      const { error } = await supabase
        .from('parties')
        .update({
          title: formData.title,
          description: formData.description,
          location_name: formData.location_name,
          start_time: formData.start_time,
          end_time: formData.end_time || null,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
          vibe: formData.vibe,
          is_public: formData.is_public,
          group_id: formData.group_id || null
        })
        .eq('id', partyId!);

      if (error) throw error;

      toast({
        title: "Fest uppdaterad!",
        description: `${formData.title} har uppdaterats framgångsrikt.`
      });

      navigate('/parties');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte uppdatera fest",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParty = async () => {
    if (!confirm('Är du säker på att du vill ta bort denna fest? Detta kan inte ångras.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('parties')
        .update({ is_active: false })
        .eq('id', partyId!);

      if (error) throw error;

      toast({
        title: "Fest borttagen!",
        description: "Festen har tagits bort framgångsrikt."
      });

      navigate('/parties');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte ta bort fest",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!party) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-8">
        <div className="max-w-md mx-auto">
          <p className="text-center text-muted-foreground">Laddar...</p>
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
            Redigera Fest
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

          {/* Group Selection */}
          <Card className="p-6 glass card-shadow">
            <h2 className="text-lg font-semibold mb-4">Grupp</h2>
            <div className="space-y-4">
              <Select value={formData.group_id} onValueChange={(value) => setFormData(prev => ({ ...prev, group_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj grupp (valfritt)" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.group_id && (
                <p className="text-xs text-muted-foreground">
                  Alla medlemmar i gruppen kommer automatiskt att bjudas in
                </p>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              type="submit" 
              className="w-full gradient-primary text-white button-shadow h-12"
              disabled={loading}
            >
              <Save size={18} className="mr-2" />
              {loading ? 'Sparar ändringar...' : 'Spara ändringar'}
            </Button>

            <Button 
              type="button"
              variant="destructive" 
              className="w-full h-12"
              onClick={handleDeleteParty}
              disabled={loading}
            >
              <Trash2 size={18} className="mr-2" />
              Ta bort fest
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default EditParty;