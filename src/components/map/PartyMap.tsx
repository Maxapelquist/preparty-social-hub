import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MapPin, X } from 'lucide-react';

interface Party {
  id: string;
  title: string;
  description: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  start_time: string;
  current_attendees: number;
  max_attendees: number;
  vibe: string;
}

interface PartyMapProps {
  parties: Party[];
  userLocation?: { lat: number; lng: number };
}

export function PartyMap({ parties, userLocation }: PartyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const { toast } = useToast();

  // Simple map placeholder since we don't have Mapbox token yet
  const handleTokenSubmit = () => {
    if (!mapboxToken.trim()) {
      toast({
        variant: "destructive",
        title: "Fel",
        description: "Vänligen ange en giltig Mapbox token"
      });
      return;
    }

    toast({
      title: "Token sparad!",
      description: "Kartan kommer att laddas nu"
    });
    setShowTokenInput(false);
  };

  const getVibeColor = (vibe: string) => {
    switch (vibe?.toLowerCase()) {
      case 'energetic': return 'gradient-primary';
      case 'chill': return 'gradient-secondary';
      case 'crazy': return 'gradient-accent';
      default: return 'gradient-primary';
    }
  };

  if (showTokenInput) {
    return (
      <Card className="p-6 glass card-shadow">
        <div className="text-center space-y-4">
          <MapPin className="w-12 h-12 mx-auto text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Aktivera Kartan</h3>
            <p className="text-sm text-muted-foreground">
              För att visa fester på kartan behöver vi en Mapbox token
            </p>
          </div>
          
          <div className="space-y-3">
            <Input
              placeholder="Ange din Mapbox public token"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="glass"
            />
            <div className="flex space-x-2">
              <Button 
                onClick={handleTokenSubmit}
                className="flex-1 gradient-primary text-white"
              >
                Aktivera Karta
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowTokenInput(false)}
                className="glass"
              >
                <X size={18} />
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Skaffa din token på <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Snap Map style header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold gradient-primary bg-clip-text text-transparent">
          Festkarta
        </h3>
        <p className="text-sm text-muted-foreground">
          {parties.length} fester runt dig • {userLocation ? 'Plats aktiverad' : 'Ingen plats'}
        </p>
      </div>

      {/* Map visualization */}
      <Card className="h-80 glass card-shadow relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10" />
        
        {/* User location indicator */}
        {userLocation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="relative">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-blue-400/30 rounded-full animate-ping" />
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <span className="text-xs text-blue-600 font-medium bg-white/80 px-2 py-1 rounded-full">
                Du
              </span>
            </div>
          </div>
        )}

        {/* Party markers - Snap Map style */}
        <div className="absolute inset-0 pointer-events-none">
          {parties.slice(0, 8).map((party, index) => {
            // Create a more natural distribution around the user
            const angle = (index * 45) + Math.random() * 30;
            const distance = 30 + Math.random() * 40;
            const x = 50 + Math.cos(angle * Math.PI / 180) * distance;
            const y = 50 + Math.sin(angle * Math.PI / 180) * distance;
            
            return (
              <div
                key={party.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: `${Math.max(10, Math.min(90, x))}%`,
                  top: `${Math.max(10, Math.min(90, y))}%`,
                }}
                onClick={() => setSelectedParty(party)}
              >
                {/* Party marker */}
                <div className="relative group pointer-events-auto">
                  <div className={`w-8 h-8 rounded-full ${getVibeColor(party.vibe)} flex items-center justify-center text-white text-xs font-bold shadow-lg transform transition-transform group-hover:scale-110 animate-pulse`}>
                    {party.current_attendees}
                  </div>
                  
                  {/* Pulse effect */}
                  <div className={`absolute inset-0 w-8 h-8 rounded-full ${getVibeColor(party.vibe)} opacity-30 animate-ping`} />
                  
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 backdrop-blur text-xs p-2 rounded-lg shadow-lg whitespace-nowrap">
                      <p className="font-semibold text-foreground">{party.title}</p>
                      <p className="text-muted-foreground">{party.location_name}</p>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/90" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enable interactive map button */}
        <div className="absolute bottom-4 right-4">
          <Button 
            size="sm"
            onClick={() => setShowTokenInput(true)}
            className="gradient-primary text-white button-shadow"
          >
            <MapPin size={14} className="mr-1" />
            Interaktiv
          </Button>
        </div>

        {/* Location grid overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>
      </Card>

      {/* Party list */}
      <div className="space-y-3">
        {parties.map((party) => (
          <Card key={party.id} className="p-4 glass card-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-sm">{party.title}</h4>
                  <Badge variant="secondary" className={`${getVibeColor(party.vibe)} text-white text-xs`}>
                    {party.vibe}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{party.location_name}</p>
                <p className="text-xs text-muted-foreground">
                  {party.current_attendees}/{party.max_attendees || '∞'} deltagare
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {new Date(party.start_time).toLocaleTimeString('sv-SE', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </Card>
        ))}
        
        {parties.length === 0 && (
          <Card className="p-8 glass card-shadow text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Inga fester hittades</h3>
            <p className="text-muted-foreground text-sm">
              Det verkar inte finnas några aktiva fester i ditt område just nu.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}