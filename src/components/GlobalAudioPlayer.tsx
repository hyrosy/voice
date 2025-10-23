import React from 'react';
import { Play, Pause } from 'lucide-react';

// NEW: Define the shape of the track object
interface CurrentTrack {
  url: string;
  actor: {
    ActorName: string;
    HeadshotURL: string;
  };
}

interface PlayerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  currentTrack: CurrentTrack | null; // Use the new track object
  isPlaying: boolean;
  onPlayPause: () => void;
  duration: number;
  currentTime: number;
}

const GlobalAudioPlayer: React.FC<PlayerProps> = ({ 
  audioRef, 
  currentTrack, 
  isPlaying, 
  onPlayPause, 
  duration, 
  currentTime 
}) => {
  // The player will only show if a track has been selected
  if (!currentTrack) {
    return null;
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Function to handle seeking
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (audio) {
      const clickX = e.nativeEvent.offsetX;
      const width = e.currentTarget.offsetWidth;
      const newTime = (clickX / width) * audio.duration;
      audio.currentTime = newTime;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 flex items-center gap-4 z-50">
      <img src={currentTrack.actor.HeadshotURL} alt={currentTrack.actor.ActorName} className="w-14 h-14 rounded-md object-cover" />
      <div>
        <p className="font-bold text-white">{currentTrack.actor.ActorName}</p>
        <p className="text-sm text-slate-400">Main Demo Reel</p>
      </div>
      <div className="flex-grow flex items-center justify-center gap-4">
        <button onClick={onPlayPause} className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full">
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-400 w-full max-w-md">
            <span>{formatTime(currentTime)}</span>
            <div 
              className="flex-grow h-1 bg-slate-600 rounded-full cursor-pointer"
              onClick={handleSeek}
            >
                <div className="h-1 bg-white rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
            </div>
            <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalAudioPlayer;
