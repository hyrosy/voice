import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Headphones, PlayCircle, Music, ArrowRight, Heart, Users, Repeat, DollarSign, Play, Pause, Search, RotateCcw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import GlobalAudioPlayer from '../components/GlobalAudioPlayer';

// --- Interfaces ---
interface Actor {
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
interface Demo {
  id: string;
  title: string;
  demo_url: string;
  actors: {
    ActorName: string;
    slug: string;
    HeadshotURL: string;
  };
}
interface CurrentTrack {
  url: string;
  actor: {
    ActorName: string;
    HeadshotURL: string;
  }
}

// --- ActorCard Component ---
const ActorCard = ({ actor, onPlayClick, isCurrentlyPlaying }: { actor: Actor, onPlayClick: (actor: Actor) => void, isCurrentlyPlaying: boolean }) => {
  const handlePlayButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

// --- DemoPlayerRow Component ---
const DemoPlayerRow = ({ demo, onPlayClick, isCurrentlyPlaying }: { demo: Demo, onPlayClick: (demo: Demo) => void, isCurrentlyPlaying: boolean }) => {
  return (
    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center gap-4">
      <img src={demo.actors.HeadshotURL} alt={demo.actors.ActorName} className="w-16 h-16 rounded-md object-cover" />
      <div className="flex-grow">
        <p className="font-bold text-white">{demo.title}</p>
        <Link to={`/actor/${demo.actors.slug}`} className="text-sm text-slate-400 hover:text-purple-400 transition-colors">
          {demo.actors.ActorName}
        </Link>
      </div>
      <button
        onClick={() => onPlayClick(demo)}
        className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
      >
        {isCurrentlyPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
      </button>
    </div>
  );
};

// --- Main Page Component ---
const VoiceOverLandingPage = () => {
    // --- State for Data & Filtering ---
    const [actors, setActors] = useState<Actor[]>([]);
    const [filteredDemos, setFilteredDemos] = useState<Demo[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [languageFilter, setLanguageFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    const [styleFilter, setStyleFilter] = useState('all');
    const [languages, setLanguages] = useState<string[]>([]); // This will be populated from DB

    // --- Global Audio Player State (Cleaned) ---
    const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    // --- Hardcoded Filter Options ---
    const languageOptions = ["English (US)", "English (UK)", "Arabic (MSA)", "Arabic (Egyptian)", "French (France)", "Spanish (Spain)"];
    const styleOptions = ["Warm", "Deep", "Conversational", "Corporate", "Announcer", "Character", "Young Adult", "Senior"];

    // --- Data Fetching Effect (Handles both views) ---
    useEffect(() => {
        const performSearch = async () => {
            const hasFilters = languageFilter !== 'all' || genderFilter !== 'all' || styleFilter !== 'all';
            setIsSearching(hasFilters);
            setIsLoading(true);

            if (hasFilters) {
                // --- DEMO SEARCH LOGIC (Playlist View) ---
                let query = supabase.from('demos').select('*, actors!inner(ActorName, slug, HeadshotURL, Gender)');
                if (languageFilter !== 'all') query = query.eq('language', languageFilter);
                if (styleFilter !== 'all') query = query.eq('style_tag', styleFilter);
                if (genderFilter !== 'all') query = query.eq('actors.Gender', genderFilter);
                
                const { data, error } = await query.order('created_at', { ascending: false });

                if (error) console.error("Error fetching demos:", error);
                else setFilteredDemos(data as Demo[] || []);

            } else {
                // --- DEFAULT ACTOR FETCH LOGIC (Grid View) ---
                const { data, error } = await supabase.from('actors').select(`*, actor_followers(count), demo_likes(count)`).eq('IsActive', true);
                
                if (error) console.error('Error fetching actors:', error);
                else {
                    const typedData = data as Actor[] || [];
                    setActors(typedData);
                    // Dynamically create language list from actors
                    const uniqueLanguages = [...new Set(typedData.map(actor => actor.Language))].filter(Boolean);
                    setLanguages(uniqueLanguages);
                }
            }
            setIsLoading(false);
        };
        performSearch();
    }, [languageFilter, genderFilter, styleFilter]);

    // --- Audio Player Logic ---
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [currentTrack]);

    useEffect(() => {
        if (isPlaying) {
            audioRef.current?.play().catch(console.error);
        } else {
            audioRef.current?.pause();
        }
    }, [isPlaying, currentTrack]);

    const handlePlayPause = () => {
        if (currentTrack) {
            setIsPlaying(!isPlaying);
        }
    };

    const handleSelectTrack = (item: Actor | Demo) => {
        const isActor = 'MainDemoURL' in item;
        const newTrackUrl = isActor ? item.MainDemoURL : item.demo_url;
        const actorInfo = isActor ? item : item.actors;

        if (currentTrack?.url === newTrackUrl) {
            handlePlayPause();
        } else {
            setCurrentTrack({ 
                url: newTrackUrl, 
                actor: { ActorName: actorInfo.ActorName, HeadshotURL: actorInfo.HeadshotURL } 
            });
            setIsPlaying(true);
        }
    };
    
    // --- Reset Function ---
    const handleResetFilters = () => {
        setLanguageFilter('all');
        setGenderFilter('all');
        setStyleFilter('all');
    };


  const services = [
    {
      icon: Mic,
      title: "Commercial Voice Over",
      description: "Professional voice overs for TV, radio, and online advertisements that capture attention and drive results.",
      features: ["TV Commercials", "Radio Ads", "Online Marketing", "Brand Campaigns"]
    },
    {
      icon: Headphones,
      title: "Narration & Documentary",
      description: "Engaging storytelling voices for documentaries, audiobooks, and educational content.",
      features: ["Documentary Films", "Audiobooks", "Corporate Videos", "Educational Content"]
    },
    {
      icon: PlayCircle,
      title: "Character & Animation",
      description: "Dynamic character voices for animations, video games, and entertainment projects.",
      features: ["Animation Characters", "Video Game Voices", "Cartoon Characters", "Interactive Media"]
    },
    {
      icon: Music,
      title: "IVR & Phone Systems",
      description: "Clear, professional voices for phone systems, automated messages, and customer service.",
      features: ["Phone Systems", "Auto Attendants", "Hold Messages", "Customer Service"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-2xl">
              <Mic className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 leading-tight">
              Voice Over
              <br />
              <span className="text-5xl md:text-7xl">Excellence</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your content with professional voice overs that captivate, engage, and deliver results. 
              From commercials to documentaries, we bring your words to life.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/contact" className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
              <span className="relative z-10">Get Started Today</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
                  <a href="#simples" className="px-8 py-4 border-2 border-slate-400 text-slate-300 rounded-full font-semibold text-lg hover:border-white hover:text-white transition-all duration-300 hover:scale-105">
              View Simples
            </a>
          </div>
        </div>
      </section>         

      {/* MP3 Player Section */}
      <section id="voices" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Voice Actors</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Browse our roster of professional talent. Filter by language and gender to find the perfect voice for your project.
            </p>
          </div>

          {/* NEW: Filter controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 items-center">
                        <select 
                            value={languageFilter} // Added value
                            onChange={(e) => setLanguageFilter(e.target.value)} 
                            className="bg-slate-800 border border-slate-700 text-white rounded-lg p-3 w-full sm:w-auto"
                        >
                            <option value="all">All Languages</option>
                            {languageOptions.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                        <select 
                            value={genderFilter} // Added value
                            onChange={(e) => setGenderFilter(e.target.value)} 
                            className="bg-slate-800 border border-slate-700 text-white rounded-lg p-3 w-full sm:w-auto"
                        >
                            <option value="all">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        <select 
                            value={styleFilter} // Added value
                            onChange={(e) => setStyleFilter(e.target.value)} 
                            className="bg-slate-800 border border-slate-700 text-white rounded-lg p-3 w-full sm:w-auto"
                        >
                            <option value="all">All Styles</option>
                            {styleOptions.map(style => <option key={style} value={style}>{style}</option>)}
                        </select>
                        {isSearching && (
                            <button onClick={handleResetFilters} className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Reset filters">
                                <RotateCcw size={20} />
                            </button>
                        )}
                    </div>

          {/* --- CONDITIONAL RENDER: Grid or Playlist --- */}
                    {isLoading ? (
                        <p className="text-white text-center">Loading...</p>
                    ) : isSearching ? (
                        <div className="max-w-3xl mx-auto space-y-4">
                            {filteredDemos.length > 0 ? (
                                filteredDemos.map(demo => (
                                    <DemoPlayerRow key={demo.id} demo={demo} onPlayClick={handleSelectTrack} isCurrentlyPlaying={isPlaying && currentTrack?.url === demo.demo_url} />
                                ))
                            ) : (
                                <p className="text-slate-500 text-center py-8">No demos found for your search criteria.</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {actors.map(actor => (
                                actor.slug && <ActorCard key={actor.id} actor={actor} onPlayClick={handleSelectTrack} isCurrentlyPlaying={isPlaying && currentTrack?.url === actor.MainDemoURL} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* --- Corrected Player Rendering --- */}
            <GlobalAudioPlayer
                audioRef={audioRef}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                duration={duration}
                currentTime={currentTime}
                />
                {/* Hidden audio element, controlled by the Global Player */}
                 <audio ref={audioRef} src={currentTrack?.url || ''} />
      
    </div>
  );
};

export default VoiceOverLandingPage;