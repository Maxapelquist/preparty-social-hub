import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileImageViewer } from "./ProfileImageViewer";
import { cn } from "@/lib/utils";

interface ClickableAvatarProps {
  src?: string | null;
  fallback: string;
  userName: string;
  profilePictures?: string[];
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ClickableAvatar({
  src,
  fallback,
  userName,
  profilePictures = [],
  className,
  size = "md"
}: ClickableAvatarProps) {
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Combine avatar_url with profile_pictures, putting avatar_url first if it exists
  const allImages = src 
    ? [src, ...profilePictures.filter(img => img !== src)]
    : profilePictures;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12"
  };

  const handleClick = () => {
    if (allImages.length > 0) {
      setShowImageViewer(true);
    }
  };

  return (
    <>
      <Avatar 
        className={cn(
          sizeClasses[size],
          "border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-all duration-200 hover:scale-105",
          className
        )}
        onClick={handleClick}
      >
        <AvatarImage src={src || undefined} className="object-cover" />
        <AvatarFallback className="gradient-primary text-white font-bold">
          {fallback}
        </AvatarFallback>
      </Avatar>

      <ProfileImageViewer
        images={allImages}
        initialIndex={0}
        userName={userName}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
      />
    </>
  );
}