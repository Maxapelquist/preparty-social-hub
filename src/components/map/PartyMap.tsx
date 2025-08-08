import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ExternalLink } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { NativeMap } from './NativeMap';

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
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  const openInMapsApp = (party: Party) => {
    const lat = party.location_lat;
    const lng = party.location_lng;
    const label = encodeURIComponent(party.title);
    
    if (Capacitor.getPlatform() === 'ios') {
      // Open in Apple Maps
      window.open(`https://maps.apple.com/?q=${lat},${lng}&ll=${lat},${lng}&z=15&t=m`, '_system');
    } else {
      // Open in Google Maps
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`, '_system');
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold gradient-primary bg-clip-text text-transparent">
          Festkarta
        </h3>
        <p className="text-sm text-muted-foreground">
          {parties.length} fester runt dig • {userLocation ? 'Plats aktiverad' : 'Ingen plats'}
        </p>
      </div>

      {/* Native Map Component */}
      <NativeMap 
        parties={parties} 
        userLocation={userLocation}
        onPartySelect={setSelectedParty}
        className="h-80"
      />

      {/* Party list with enhanced actions */}
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
                
                {/* Mobile-optimized action */}
                <div className="flex items-center space-x-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => openInMapsApp(party)}
                    className="text-xs h-6"
                  >
                    <ExternalLink size={12} className="mr-1" />
                    Öppna i kartor
                  </Button>
                </div>
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