// In src/components/ActorCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Heart, Users, Repeat, DollarSign } from 'lucide-react';

// Interfaces remain the same...
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
    // Card Container: Flex column, full height potential, padding, background, border, etc.
    <Link
      to={`/actor/${actor.slug}`}
      className="group relative bg-slate-800/70 p-4 rounded-lg border border-slate-700/50 hover:border-slate-600 hover:bg-slate-700/50 transition-all duration-300 flex flex-col h-full shadow-lg"
    >
      {/* Image and Play Button */}
      <div className="relative mb-4">
        <img
          src={actor.HeadshotURL}
          alt={actor.ActorName}
          className="w-full rounded-md aspect-square object-cover"
        />
        <button
          onClick={handlePlayButtonClick}
          // Adjusted size slightly
          className={`absolute bottom-2 right-2 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center
                      shadow-lg opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 transform
                      ${isCurrentlyPlaying ? 'opacity-100 scale-110' : ''}`} // Simpler transition for visibility
        >
          {isCurrentlyPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>
      </div>

      {/* Actor Name - Centered, slightly larger */}
      <div className="text-center mb-3 flex-grow">
          <h3 className="font-bold text-lg text-white truncate">{actor.ActorName}</h3>
      </div>

      {/* Stats Row - Icons + Numbers */}
      <div className="flex justify-around items-center text-xs text-slate-400 mb-3 border-t border-b border-slate-700/80 py-2">
          <div className="flex items-center gap-1.5" title={`${actor.demo_likes[0]?.count || 0} Likes`}>
            <Heart size={14} className="text-pink-400"/>
            <span>{actor.demo_likes[0]?.count || 0}</span>
          </div>
          <div className="flex items-center gap-1.5" title={`${actor.actor_followers[0]?.count || 0} Followers`}>
            <Users size={14} className="text-blue-400"/>
            <span>{actor.actor_followers[0]?.count || 0}</span>
          </div>
          <div className="flex items-center gap-1.5" title={`${actor.revisions_allowed} Revisions Included`}>
            <Repeat size={14} className="text-green-400"/>
            <span>{actor.revisions_allowed}</span>
          </div>
      </div>

      {/* Price Row - Centered, distinct */}
       <div className="text-center">
          <p className="text-xs font-semibold text-purple-300 whitespace-nowrap">
            From {actor.BaseRate_per_Word} MAD/word
          </p>
        </div>

    </Link>
  );
};

export default ActorCard;