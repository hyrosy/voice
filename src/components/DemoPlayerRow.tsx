// src/components/DemoPlayerRow.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Play, Pause } from 'lucide-react';

// Define the types here or import from a central types file
interface ActorInfo {
  id: string;
  ActorName: string;
  slug: string;
  HeadshotURL: string;
  Gender?: string;
}

export interface Demo {
  id: string;
  title: string;
  demo_url: string;
  actors: ActorInfo;
  likes?: number;
}

interface DemoPlayerRowProps {
  demo: Demo;
  onPlayClick: (demo: Demo) => void;
  isCurrentlyPlaying: boolean;
  isLiked: boolean;
  onToggleLike: (demo: Demo) => void;
}

const DemoPlayerRow: React.FC<DemoPlayerRowProps> = ({
  demo,
  onPlayClick,
  isCurrentlyPlaying,
  isLiked,
  onToggleLike
}) => {
  return (
    <div className="bg-card p-3 rounded-lg border flex items-center gap-4 sm:gap-6">
      {/* Actor Image */}
      <img src={demo.actors.HeadshotURL} alt={demo.actors.ActorName} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />

      {/* Demo Title & Actor Name */}
      <div className="flex-grow min-w-0">
        <p className="font-bold text-foreground truncate">{demo.title}</p>
        <Link to={`/actor/${demo.actors.slug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors truncate">
          {demo.actors.ActorName}
        </Link>
      </div>

      {/* Likes Button & Count */}
      <button
        onClick={() => onToggleLike(demo)}
        className="flex items-center gap-1.5 text-muted-foreground flex-shrink-0 px-2 rounded-md hover:bg-accent transition-colors"
        title={isLiked ? "Unlike" : "Like"}
      >
        <Heart
          size={16}
          className={`transition-colors ${isLiked ? 'text-pink-500 fill-current' : 'text-muted-foreground group-hover:text-accent-foreground'}`}
        />
        <span className="text-sm font-semibold">{demo.likes || 0}</span>
      </button>

      {/* Play Button */}
      <button
        onClick={() => onPlayClick(demo)}
        className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
      >
        {isCurrentlyPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
      </button>
    </div>
  );
};

export default DemoPlayerRow;