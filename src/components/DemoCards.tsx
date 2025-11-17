// In src/components/DemoCards.tsx

import React, { useState, useRef } from 'react'; // <-- Import useState and useRef
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mic, FileText, Video, Play, Pause, Heart } from 'lucide-react'; // <-- Import Play/Pause/Heart
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils'; // <-- Make sure this is imported

// This is the same interface from your old file
export interface Demo {
  demo_type: 'audio' | 'video' | 'script';
  demo_id: string;
  demo_title: string;
  demo_url: string | null;
  demo_content: string | null;
  created_at: string;
  actor_id: string;
  actor_name: string;
  actor_slug: string;
  actor_headshot: string;
  likes?: number;
}

interface DemoCardProps {
  demo: Demo;
}

// --- 1. A shared footer for Audio and Script ---
const ActorFooter: React.FC<DemoCardProps> = ({ demo }) => (
  <CardFooter className="p-4 pt-0 mt-auto border-t bg-accent/50">
    <Link to={`/actor/${demo.actor_slug}`} className="flex items-center gap-3 group w-full">
      <Avatar className="w-10 h-10 border-2 border-transparent group-hover:border-primary/50 transition-colors">
        <AvatarImage src={demo.actor_headshot} alt={demo.actor_name} />
        <AvatarFallback>{demo.actor_name?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold text-sm text-muted-foreground">Actor</p>
        <p className="text-sm text-foreground group-hover:text-primary transition-colors">
          {demo.actor_name}
        </p>
      </div>
    </Link>
  </CardFooter>
);

// --- 2. The Audio Card (Correct) ---
export const AudioDemoCard: React.FC<DemoCardProps> = ({ demo }) => (
  <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/50">
    <CardHeader className="p-4">
      <div className="flex justify-between items-start gap-2">
        <CardTitle className="text-lg font-semibold line-clamp-2">{demo.demo_title}</CardTitle>
        <Badge variant="default" className="flex-shrink-0 capitalize">
          <Mic className="h-3 w-3 mr-1.5" />
          Audio
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="flex-grow p-4 pt-0">
      <audio controls src={demo.demo_url || ''} className="w-full h-10" />
    </CardContent>
    <ActorFooter demo={demo} />
  </Card>
);

// --- 3. The Script Card (Correct) ---
export const ScriptDemoCard: React.FC<DemoCardProps> = ({ demo }) => (
  <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/50">
    <CardHeader className="p-4">
      <div className="flex justify-between items-start gap-2">
        <CardTitle className="text-lg font-semibold line-clamp-2">{demo.demo_title}</CardTitle>
        <Badge variant="secondary" className="flex-shrink-0 capitalize">
          <FileText className="h-3 w-3 mr-1.5" />
          Script
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="flex-grow p-4 pt-0">
      <div className="h-48 p-3 bg-muted/50 rounded-md overflow-y-auto border custom-scrollbar">
        <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
          "{demo.demo_content}"
        </p>
      </div>
    </CardContent>
    <ActorFooter demo={demo} />
  </Card>
);

// --- 4. The NEW Video Card (Reel Style, No Controls) ---
export const VideoDemoCard: React.FC<DemoCardProps> = ({ demo }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // This function toggles play/pause when the *card* is clicked
  const handleCardClick = (e: React.MouseEvent) => {
    // Check if the click was on the "like" button or actor link
    const target = e.target as HTMLElement;
    if (target.closest('.like-button') || target.closest('.actor-link')) {
      return; // Don't play/pause, let the link or button work
    }
    
    e.preventDefault(); // Prevent navigation
    toggleVideoPlay();
  };

  const toggleVideoPlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      video.muted = false; // Unmute when user explicitly plays
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // This will link to the actor's profile page
  return (
    <Card 
      className="relative aspect-video overflow-hidden rounded-2xl shadow-lg group transform transition-all duration-300 ease-in-out hover:shadow-2xl cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Video Background - NO CONTROLS */}
      <video
        ref={videoRef}
        src={demo.demo_url || ''}
        loop
        muted
        playsInline // Important for mobile
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        onEnded={() => setIsPlaying(false)} // Reset icon when video finishes
      />
      {/* Scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 pointer-events-none" />

      {/* Play/Pause Icon in Center */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100">
        {!isPlaying ? (
          <Play 
            className="w-16 h-16 text-white/70 drop-shadow-lg" 
            fill="currentColor" 
          />
        ) : (
          <Pause 
            className="w-16 h-16 text-white/70 drop-shadow-lg" 
            fill="currentColor" 
          />
        )}
      </div>
      
      {/* Like Button (top right) */}
      <Button 
        size="icon" 
        variant="ghost" 
        className="like-button absolute top-3 right-3 text-white rounded-full h-10 w-10 z-10"
        onClick={(e) => {
          e.stopPropagation(); // Don't let this click pause the video
          // Add your "like" logic here
          console.log("Liked video:", demo.demo_id);
        }}
      >
        <Heart className="w-6 h-6" />
      </Button>

      {/* Bottom Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{demo.demo_title}</h3>
        <Link 
          to={`/actor/${demo.actor_slug}`} 
          className="actor-link relative z-10 flex items-center gap-2 mt-2 w-fit" // w-fit so only avatar/name is clickable
          onClick={(e) => e.stopPropagation()} // Don't let this click pause the video
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={demo.actor_headshot} />
            <AvatarFallback>{demo.actor_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="text-sm text-white font-medium hover:underline">{demo.actor_name}</p>
        </Link>
      </div>
    </Card>
  );
};