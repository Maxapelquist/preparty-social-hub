import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, ChevronLeft, ChevronRight, Users, MapPin, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Attendee {
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
    age: number | null;
    bio: string | null;
    university: string | null;
    occupation: string | null;
    interests: string[];
    location_name: string | null;
  } | null;
}

interface PartyAttendeesViewerProps {
  partyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PartyAttendeesViewer({ partyId, isOpen, onClose }: PartyAttendeesViewerProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && partyId) {
      fetchAttendees();
    }
  }, [isOpen, partyId]);

  const fetchAttendees = async () => {
    try {
      const { data, error } = await supabase
        .from('party_attendees')
        .select(`
          user_id,
          profiles!party_attendees_user_id_fkey (
            display_name,
            avatar_url,
            age,
            bio,
            university,
            occupation,
            interests,
            location_name
          )
        `)
        .eq('party_id', partyId)
        .eq('status', 'attending');

      if (error) throw error;
      setAttendees(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte ladda deltagare",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const nextProfile = () => {
    setCurrentIndex((prev) => (prev + 1) % attendees.length);
  };

  const prevProfile = () => {
    setCurrentIndex((prev) => (prev - 1 + attendees.length) % attendees.length);
  };

  if (!isOpen) return null;

  const currentAttendee = attendees[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm glass card-shadow relative h-[600px] overflow-hidden">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 glass"
          onClick={onClose}
        >
          <X size={20} />
        </Button>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-center">
              <Users size={40} className="mx-auto mb-4 text-muted-foreground" />
              <p>Laddar deltagare...</p>
            </div>
          </div>
        ) : attendees.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Users size={40} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Inga deltagare än</h3>
              <p className="text-sm text-muted-foreground">
                Vänta på att fler ansluter!
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="relative h-full flex flex-col">
              {/* Avatar Section */}
              <div className="relative h-64 gradient-hero flex items-center justify-center">
                <Avatar className="w-32 h-32 border-4 border-white/20">
                  <AvatarImage src={currentAttendee?.profiles?.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="gradient-primary text-white text-3xl font-bold">
                    {(currentAttendee?.profiles?.display_name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Navigation Arrows */}
                {attendees.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 glass text-white"
                      onClick={prevProfile}
                    >
                      <ChevronLeft size={20} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 glass text-white"
                      onClick={nextProfile}
                    >
                      <ChevronRight size={20} />
                    </Button>
                  </>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 p-6 space-y-4">
                <div className="text-center">
                  <h2 className="text-xl font-bold">{currentAttendee?.profiles?.display_name || 'Okänd användare'}</h2>
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    {currentAttendee?.profiles?.age && (
                      <span>{currentAttendee.profiles.age} år</span>
                    )}
                    {currentAttendee?.profiles?.location_name && (
                      <>
                        <span>•</span>
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          <span>{currentAttendee.profiles.location_name}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {currentAttendee?.profiles?.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {currentAttendee.profiles.bio}
                    </p>
                  </div>
                )}

                {(currentAttendee?.profiles?.university || currentAttendee?.profiles?.occupation) && (
                  <div className="space-y-2">
                    {currentAttendee.profiles.university && (
                      <div className="text-sm">
                        <span className="font-medium">Universitet: </span>
                        <span>{currentAttendee.profiles.university}</span>
                      </div>
                    )}
                    {currentAttendee.profiles.occupation && (
                      <div className="text-sm">
                        <span className="font-medium">Yrke: </span>
                        <span>{currentAttendee.profiles.occupation}</span>
                      </div>
                    )}
                  </div>
                )}

                {currentAttendee?.profiles?.interests && currentAttendee.profiles.interests.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Intressen</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentAttendee.profiles.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 space-y-3">
                <Button className="w-full gradient-primary text-white button-shadow">
                  <Heart size={16} className="mr-2" />
                  Skicka vänförfrågan
                </Button>
                
                {attendees.length > 1 && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      {currentIndex + 1} av {attendees.length} deltagare
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}