import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ProfilePictureUploadProps {
  currentPictures?: string[];
  onPicturesChange: (pictures: string[]) => void;
  maxPictures?: number;
}

export function ProfilePictureUpload({ 
  currentPictures = [], 
  onPicturesChange,
  maxPictures = 5 
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadPicture = async (file: File) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading picture:', error);
      throw error;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (currentPictures.length + files.length > maxPictures) {
      toast({
        title: "För många bilder",
        description: `Du kan bara ha max ${maxPictures} profilbilder`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const uploadPromises = files.map(file => uploadPicture(file));
      const newUrls = await Promise.all(uploadPromises);
      
      const updatedPictures = [...currentPictures, ...newUrls];
      onPicturesChange(updatedPictures);
      
      toast({
        title: "Bilder uppladdade",
        description: `${files.length} bild${files.length > 1 ? 'er' : ''} har laddats upp`,
      });
    } catch (error) {
      toast({
        title: "Uppladdning misslyckades",
        description: "Kunde inte ladda upp bilderna. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const removePicture = async (index: number) => {
    const pictureUrl = currentPictures[index];
    
    try {
      // Extract filename from URL
      const urlParts = pictureUrl.split('/');
      const fileName = urlParts.slice(-2).join('/'); // user_id/filename.ext
      
      // Delete from storage
      const { error } = await supabase.storage
        .from('profile-pictures')
        .remove([fileName]);

      if (error) {
        console.error('Error deleting from storage:', error);
      }

      // Remove from current pictures
      const updatedPictures = currentPictures.filter((_, i) => i !== index);
      onPicturesChange(updatedPictures);
      
      toast({
        title: "Bild borttagen",
        description: "Bilden har tagits bort från din profil",
      });
    } catch (error) {
      toast({
        title: "Fel vid borttagning",
        description: "Kunde inte ta bort bilden. Försök igen.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Profilbilder</h3>
        <span className="text-sm text-muted-foreground">
          {currentPictures.length}/{maxPictures}
        </span>
      </div>

      {/* Current Pictures */}
      {currentPictures.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {currentPictures.map((url, index) => (
            <div key={index} className="relative group">
              <Avatar className="w-20 h-20">
                <AvatarImage src={url} alt={`Profilbild ${index + 1}`} className="object-cover" />
                <AvatarFallback>
                  <ImagePlus className="w-8 h-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removePicture(index)}
              >
                <X className="w-3 h-3" />
              </Button>
              {index === 0 && (
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Huvudbild
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {currentPictures.length < maxPictures && (
        <div>
          <input
            type="file"
            id="picture-upload"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <label htmlFor="picture-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full cursor-pointer"
              disabled={uploading}
              asChild
            >
              <div className="flex items-center gap-2">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImagePlus className="w-4 h-4" />
                )}
                {uploading ? 'Laddar upp...' : 'Lägg till bilder'}
              </div>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Den första bilden blir din huvudprofilbild
          </p>
        </div>
      )}
    </div>
  );
}