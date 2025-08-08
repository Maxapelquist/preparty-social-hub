import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface NativeMapProps {
  parties: Party[];
  userLocation?: { lat: number; lng: number };
  onPartySelect?: (party: Party) => void;
  className?: string;
}

export function NativeMap({ parties, userLocation, onPartySelect, className = "h-80" }: NativeMapProps) {
  const mapRef = useRef<HTMLElement>(null);
  const [map, setMap] = useState<GoogleMap | null>(null);
  const { toast } = useToast();

  const getVibeColor = (vibe: string): string => {
    switch (vibe?.toLowerCase()) {
      case 'energetic': return '#ef4444'; // red
      case 'chill': return '#3b82f6';     // blue
      case 'crazy': return '#8b5cf6';     // purple
      default: return '#10b981';          // green
    }
  };

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

  useEffect(() => {
    if (!mapRef.current || !Capacitor.isNativePlatform()) return;

    const createMap = async () => {
      try {
        const newMap = await GoogleMap.create({
          id: 'native-party-map',
          element: mapRef.current!,
          apiKey: '', // Will be handled by native configuration
          config: {
            center: userLocation || { lat: 59.334591, lng: 18.063240 }, // Default to Stockholm
            zoom: 12,
            androidLiteMode: false,
          },
        });

        await newMap.enableCurrentLocation(true);
        
        // Add party markers
        const markers = parties.map(party => ({
          coordinate: {
            lat: party.location_lat,
            lng: party.location_lng,
          },
          title: party.title,
          snippet: `${party.location_name} • ${party.current_attendees} deltagare`,
          markerId: party.id,
        }));

        if (markers.length > 0) {
          await newMap.addMarkers(markers);
        }

        // Handle marker clicks
        await newMap.setOnMarkerClickListener((event) => {
          const party = parties.find(p => p.id === event.markerId);
          if (party && onPartySelect) {
            onPartySelect(party);
          }
        });

        setMap(newMap);
      } catch (error) {
        console.error('Error creating native map:', error);
        toast({
          variant: "destructive",
          title: "Kartfel",
          description: "Kunde inte ladda kartan. Kontrollera att du har en internetanslutning."
        });
      }
    };

    createMap();

    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, [parties, userLocation]);

  // Fallback for web platform - show a styled placeholder
  if (!Capacitor.isNativePlatform()) {
    return (
      <div className={`${className} bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-lg relative overflow-hidden flex flex-col items-center justify-center glass`}>
        <div className="text-center space-y-4">
          <MapPin className="w-12 h-12 mx-auto text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Mobilkarta</h3>
            <p className="text-sm text-muted-foreground">
              Den här funktionen är tillgänglig i mobilappen
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {parties.length} fester visas på kartan i appen
          </p>
        </div>
        
        {/* Show parties with "Open in Maps" buttons for web */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="space-y-2 max-h-20 overflow-y-auto">
            {parties.slice(0, 3).map((party) => (
              <div key={party.id} className="flex items-center justify-between bg-white/80 backdrop-blur p-2 rounded text-xs">
                <span className="font-medium truncate">{party.title}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openInMapsApp(party)}
                  className="ml-2 h-6 px-2"
                >
                  <ExternalLink size={12} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative rounded-lg overflow-hidden`}>
      <capacitor-google-map 
        ref={mapRef} 
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
      
      {/* Floating action buttons for native map */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <Button
          size="sm"
          variant="secondary"
          className="bg-white/90 backdrop-blur shadow-lg"
          onClick={() => {
            if (map && userLocation) {
              map.setCamera({
                coordinate: userLocation,
                zoom: 15,
                animate: true,
              });
            }
          }}
        >
          <Navigation size={14} />
        </Button>
      </div>
    </div>
  );
}