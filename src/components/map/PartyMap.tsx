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
      {/* Map placeholder */}
      <Card className="h-64 glass card-shadow relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-3">
            <MapPin className="w-12 h-12 mx-auto text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Festkarta</h3>
              <p className="text-sm text-muted-foreground">
                {parties.length} fester i området
              </p>
            </div>
            <Button 
              onClick={() => setShowTokenInput(true)}
              className="gradient-primary text-white button-shadow"
            >
              Aktivera Interaktiv Karta
            </Button>
          </div>
        </div>

        {/* Party markers overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {parties.slice(0, 3).map((party, index) => (
            <div
              key={party.id}
              className={`absolute w-4 h-4 rounded-full ${getVibeColor(party.vibe)} animate-pulse`}
              style={{
                left: `${20 + index * 25}%`,
                top: `${30 + index * 15}%`,
              }}
            />
          ))}
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