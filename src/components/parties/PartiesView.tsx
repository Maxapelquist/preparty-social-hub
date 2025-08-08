import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClickableAvatar } from "@/components/profile/ClickableAvatar";
import { Search, Filter, MapPin, Clock, Users, Plus, Map, Star, MessageCircle, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PartyMap } from "@/components/map/PartyMap";
import { PartyAttendeesViewer } from "./PartyAttendeesViewer";

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
  current_attendees: number;
  max_attendees: number;
  vibe: string;
  is_public: boolean;
  group_id: string | null;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
    profile_pictures?: string[];
  } | null;
}

export function PartiesView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);

  useEffect(() => {
    fetchParties();
    getUserLocation();
  }, []);

  const fetchParties = async () => {
    try {
      const { data, error } = await supabase
        .from('parties')
        .select(`
          *,
          profiles!fk_parties_host_id (display_name, avatar_url, profile_pictures)
        `)
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      if (error) throw error;
      const partiesData = (data || []).map(party => ({
        ...party,
        profiles: Array.isArray(party.profiles) ? party.profiles[0] : party.profiles
      }));
      setParties(partiesData as Party[]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte ladda fester",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('location_lat, location_lng')
      .eq('user_id', user.id)
      .single();
    
    if (data?.location_lat && data?.location_lng) {
      setUserLocation({
        lat: data.location_lat,
        lng: data.location_lng
      });
      setLocationEnabled(true);
      setShowMap(true); // Auto-show map when location is available
    }
  };

  const getVibeColor = (vibe: string) => {
    switch (vibe?.toLowerCase()) {
      case 'energetic': return 'gradient-primary';
      case 'chill': return 'gradient-secondary';
      case 'crazy': return 'gradient-accent';
      default: return 'gradient-primary';
    }
  };

  const filteredParties = parties.filter(party =>
    party.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    party.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    party.vibe.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Fester Runt Dig
          </h1>
          <Button 
            className="gradient-primary text-white button-shadow"
            onClick={() => navigate('/parties/create')}
          >
            <Plus size={20} className="mr-2" />
            Skapa
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Sök fester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="glass">
              <Filter size={16} className="mr-2" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`glass ${showMap ? 'gradient-primary text-white' : ''}`}
              onClick={() => setShowMap(!showMap)}
              disabled={!locationEnabled}
            >
              <Map size={16} className="mr-2" />
              {locationEnabled ? (showMap ? 'Lista' : 'Karta') : 'Ingen plats'}
            </Button>
          </div>
        </div>

        {/* Map or Stats */}
        {(showMap && locationEnabled) ? (
          <PartyMap parties={filteredParties} userLocation={userLocation} />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 glass card-shadow text-center">
              <p className="text-lg font-bold text-primary">{parties.length}</p>
              <p className="text-xs text-muted-foreground">Aktiva Fester</p>
            </Card>
            <Card className="p-3 glass card-shadow text-center">
              <p className="text-lg font-bold text-secondary">
                {parties.reduce((sum, party) => sum + party.current_attendees, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Deltagare</p>
            </Card>
            <Card className="p-3 glass card-shadow text-center">
              <p className="text-lg font-bold text-accent">
                {userLocation ? '0.5' : '-'} km
              </p>
              <p className="text-xs text-muted-foreground">Genomsnitt</p>
            </Card>
          </div>
        )}

        {/* Parties List */}
        {(!showMap || !locationEnabled) && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Star size={20} className="mr-2 text-primary" />
              Fester i Närheten
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 glass card-shadow">
                    <div className="animate-pulse flex space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredParties.length > 0 ? (
              filteredParties.map((party) => (
                <Card key={party.id} className="p-4 glass card-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-lg" />
                  
                  <div className="relative space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <ClickableAvatar
                          src={party.profiles?.avatar_url}
                          fallback={(party.profiles?.display_name || 'V').charAt(0).toUpperCase()}
                          userName={party.profiles?.display_name || 'Okänd'}
                          profilePictures={party.profiles?.profile_pictures || []}
                          className="border-2 border-primary/20"
                        />
                        <div>
                          <h3 className="font-bold text-lg">{party.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Värd: {party.profiles?.display_name || 'Okänd'}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getVibeColor(party.vibe)} text-white`}>
                        {party.vibe}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin size={16} className="text-accent" />
                        <span>{party.location_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock size={16} className="text-secondary" />
                        <span>
                          {new Date(party.start_time).toLocaleTimeString('sv-SE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Attendees */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Users size={16} className="text-primary" />
                        <span className="text-sm">
                          {party.current_attendees}/{party.max_attendees || '∞'} deltagare
                        </span>
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="gradient-primary h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: party.max_attendees 
                              ? `${(party.current_attendees / party.max_attendees) * 100}%` 
                              : '50%' 
                          }}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    {party.description && (
                      <p className="text-sm text-muted-foreground">
                        {party.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-3 pt-2">
                      {party.host_id === user?.id ? (
                        <Button 
                          className="flex-1 gradient-primary text-white button-shadow"
                          onClick={() => navigate(`/parties/${party.id}/edit`)}
                        >
                          <Edit size={16} className="mr-2" />
                          Redigera
                        </Button>
                      ) : (
                        <Button className="flex-1 gradient-primary text-white button-shadow">
                          Skicka Förfrågan
                        </Button>
                      )}
                      {party.is_public && (
                        <Button 
                          variant="outline" 
                          className="glass"
                          onClick={() => setSelectedPartyId(party.id)}
                        >
                          <Users size={16} className="mr-2" />
                          Visa medlemmar
                        </Button>
                      )}
                      <Button variant="outline" size="icon" className="glass">
                        <Star size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 glass card-shadow text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full gradient-hero opacity-20 flex items-center justify-center">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Inga fester hittades</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'Prova att söka efter något annat' : 'Bli den första att skapa en fest!'}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Create Party CTA */}
        <Card className="p-6 glass card-shadow gradient-hero relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="relative text-center text-white">
            <MapPin size={32} className="mx-auto mb-3 opacity-80" />
            <h3 className="font-bold mb-2">Skapa Din Egen Fest</h3>
            <p className="text-sm opacity-80 mb-4">
              Bjud in andra grupper och skapa minnesvärda stunder!
            </p>
            <Button 
              variant="secondary" 
              className="bg-white/20 backdrop-blur text-white border-white/20 hover:bg-white/30"
              onClick={() => navigate('/parties/create')}
            >
              Kom Igång
            </Button>
          </div>
        </Card>
        
        {/* Party Attendees Viewer */}
        <PartyAttendeesViewer
          partyId={selectedPartyId || ''}
          isOpen={!!selectedPartyId}
          onClose={() => setSelectedPartyId(null)}
        />
      </div>
    </div>
  );
}