import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Heart, Users, Repeat, DollarSign } from 'lucide-react';

// A more detailed interface for the data this page now needs
export interface Actor {
  id: string;
  slug: string | null;
  ActorName: string;
  Gender: string;
  Language: string;
  HeadshotURL: string;
  MainDemoURL: string;
  actor_followers: { count: number }[];
  demo_likes: { count: number }[];
  revisions_allowed: number;
  BaseRate_per_Word: number;
  IsActive: boolean;
}

interface ActorCardProps {
  actor: Actor;
  onPlayClick: (actor: Actor) => void;
  isCurrentlyPlaying: boolean;
}

const ActorCard: React.FC<ActorCardProps> = ({ actor, onPlayClick, isCurrentlyPlaying }) => {
  const handlePlayButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the Link from navigating
    e.preventDefault();
    onPlayClick(actor);
  };

  return (
    <Link to={`/actor/${actor.slug}`} className="group relative bg-slate-800/50 p-4 rounded-lg hover:bg-slate-700/50 transition-colors duration-300 block">
      <div className="relative mb-4">
        <img 
          src={actor.HeadshotURL} 
          alt={actor.ActorName} 
          className="w-full rounded-md aspect-square object-cover"
        />
        <button
          onClick={handlePlayButtonClick}
          className={`absolute bottom-2 right-2 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center
                      shadow-lg opacity-0 group-hover:opacity-100 group-hover:bottom-4 transition-all duration-300
                      ${isCurrentlyPlaying ? 'opacity-100 bottom-4' : ''}`}
        >
          {isCurrentlyPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>
      </div>
      
      <h3 className="font-bold text-white truncate">{actor.ActorName}</h3>
      <div className="mt-2 space-y-2 text-xs text-slate-400">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5"><Heart size={12} /><span>{actor.demo_likes[0]?.count || 0} Likes</span></div>
            <div className="flex items-center gap-1.5"><Users size={12} /><span>{actor.actor_followers[0]?.count || 0} Followers</span></div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <div className="flex items-center gap-1.5"><DollarSign size={12} /><span>From {actor.BaseRate_per_Word} MAD/word</span></div>
            <div className="flex items-center gap-1.5"><Repeat size={12} /><span>{actor.revisions_allowed} Revisions</span></div>
        </div>
      </div>
    </Link>
  );
};

export default ActorCard;

