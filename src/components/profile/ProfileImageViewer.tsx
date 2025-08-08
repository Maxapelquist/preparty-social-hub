import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Download, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileImageViewerProps {
  images: string[];
  initialIndex?: number;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileImageViewer({ 
  images, 
  initialIndex = 0, 
  userName, 
  isOpen, 
  onClose 
}: ProfileImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (images.length > 1) {
            setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
          }
          break;
        case 'ArrowRight':
          if (images.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % images.length);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose]);

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = images[currentIndex];
    link.download = `${userName}-profile-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareImage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userName}s profilbild`,
          url: images[currentIndex]
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(images[currentIndex]);
    }
  };

  if (!isOpen || !images.length) return null;

  const content = (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10 border-2 border-white/20">
            <AvatarImage src={images[currentIndex]} className="object-cover" />
            <AvatarFallback className="gradient-primary text-white font-bold">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-white">
            <h3 className="font-semibold">{userName}</h3>
            {images.length > 1 && (
              <p className="text-sm text-white/70">
                {currentIndex + 1} av {images.length} bilder
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={shareImage}
          >
            <Share2 size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={downloadImage}
          >
            <Download size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
            onClick={prevImage}
          >
            <ChevronLeft size={24} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
            onClick={nextImage}
          >
            <ChevronRight size={24} />
          </Button>
        </>
      )}

      {/* Main Image */}
      <div 
        className="relative max-w-4xl max-h-[80vh] mx-4 cursor-pointer"
        onClick={nextImage}
      >
        <img
          src={images[currentIndex]}
          alt={`${userName} - Bild ${currentIndex + 1}`}
          className="w-full h-full object-contain rounded-lg shadow-2xl"
          style={{ maxHeight: '80vh' }}
        />
        
        {/* Image counter overlay */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/60 backdrop-blur p-2 rounded-lg">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex ? 'border-white' : 'border-white/30'
              }`}
            >
              <img
                src={image}
                alt={`Miniatyr ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Click anywhere to close */}
      <div 
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );

  // Render to document.body to escape any container constraints
  return createPortal(content, document.body);
}