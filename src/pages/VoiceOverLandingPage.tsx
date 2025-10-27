import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // <-- Add useNavigate here
import { Mic, Headphones, PlayCircle, Music, ArrowRight, Heart, Users, Repeat, DollarSign, Play, Pause, Search, RotateCcw, UserPlus, List } from 'lucide-react';
import { supabase } from '../supabaseClient';
import GlobalAudioPlayer from '../components/GlobalAudioPlayer';
import { Actor } from '../components/ActorCard'; // <-- Import Actor interface from ActorCard
// --- Interfaces ---

interface Demo {
  id: string;
  title: string;
  demo_url: string;
  actors: {
    id: string; // <-- Add this line
    ActorName: string;
    slug: string;
    HeadshotURL: string;
    Gender?: string; // Add Gender here if needed by filters
  };
  likes?: number; // <-- Add this optional property
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
// Inside VoiceOverLandingPage.tsx

// --- DemoPlayerRow Component ---
// Add isLiked and onToggleLike to props
const DemoPlayerRow = ({
    demo,
    onPlayClick,
    isCurrentlyPlaying,
    isLiked,
    onToggleLike
}: {
    demo: Demo,
    onPlayClick: (demo: Demo) => void,
    isCurrentlyPlaying: boolean,
    isLiked: boolean, // <-- New prop
    onToggleLike: (demo: Demo) => void // <-- New prop
}) => {
  return (
    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center gap-4 sm:gap-6"> {/* Adjusted gap */}
      {/* Actor Image */}
      <img src={demo.actors.HeadshotURL} alt={demo.actors.ActorName} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />

      {/* Demo Title & Actor Name */}
      <div className="flex-grow min-w-0">
        <p className="font-bold text-white truncate">{demo.title}</p>
        <Link to={`/actor/${demo.actors.slug}`} className="text-sm text-slate-400 hover:text-purple-400 transition-colors truncate">
          {demo.actors.ActorName}
        </Link>
      </div>

      {/* Likes Button & Count - UPDATED */}
      <button
        onClick={() => onToggleLike(demo)} // Call toggle function on click
        className="flex items-center gap-1.5 text-slate-400 flex-shrink-0 px-2 rounded-md hover:bg-slate-700 transition-colors" // Make it a button
        title={isLiked ? "Unlike" : "Like"}
      >
        <Heart
          size={16}
          // Change style based on isLiked prop
          className={`transition-colors ${isLiked ? 'text-pink-500 fill-current' : 'text-slate-500 group-hover:text-white'}`}
        />
        <span className="text-sm font-semibold">{demo.likes || 0}</span>
      </button>

      {/* Play Button */}
      <button
        onClick={() => onPlayClick(demo)}
        className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform" // Adjusted size
      >
        {isCurrentlyPlaying ? <Pause size={18} /> : <Play size={18}  className="ml-1" />} {/* Adjusted size */}
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
    const navigate = useNavigate(); // <-- Call the hook here
    const genderOptions = ["Male", "Female"];
    const [userLikes, setUserLikes] = useState<string[]>([]); // <-- Add this state
    const [viewMode, setViewMode] = useState<'actors' | 'demos'>('actors'); // Default to actors view

    // --- Hardcoded Filter Options ---
    const languageOptions = ["Arabic", "English", "French", "Spanish"];
    const styleOptions = ["Warm", "Deep", "Conversational", "Corporate"];

    // --- Data Fetching Effect (Handles both views) ---
    useEffect(() => {
const performSearch = async () => {
            const hasFilters = languageFilter !== 'all' || genderFilter !== 'all' || styleFilter !== 'all';
            setIsLoading(true);

            // Clear both results on new search
            setActors([]);
            setFilteredDemos([]);

            if (viewMode === 'actors') {
                // --- ACTOR SEARCH LOGIC (Grid View) ---
                let actorQuery = supabase
                    .from('actors')
                    .select(`*, actor_followers(count), demo_likes(count)`)
                    .eq('IsActive', true);

                if (languageFilter !== 'all') {
                    actorQuery = actorQuery.eq('Language', languageFilter);
                }
                if (genderFilter !== 'all') {
                    actorQuery = actorQuery.eq('Gender', genderFilter);
                }
                if (styleFilter !== 'all') {
                    actorQuery = actorQuery.like('Tags', `%${styleFilter}%`);
                }

                const { data, error } = await actorQuery.order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching actors:', error);
                } else {
                    const typedData = data as Actor[] || [];
                    setActors(typedData);
                    // Only update languages if no filters are on (in actor mode)
                    if (!hasFilters) {
                        const uniqueLanguages = [...new Set(typedData.map(actor => actor.Language))].filter(Boolean);
                        setLanguages(uniqueLanguages);
                    }
                }
            } else {
                // --- DEMO SEARCH LOGIC (Playlist View) ---
                let demoQuery = supabase.from('demos').select('*, actors!inner(id, ActorName, slug, HeadshotURL, Gender)');
                
                if (languageFilter !== 'all') demoQuery = demoQuery.eq('language', languageFilter);
                if (styleFilter !== 'all') demoQuery = demoQuery.eq('style_tag', styleFilter);
                if (genderFilter !== 'all') demoQuery = demoQuery.eq('actors.Gender', genderFilter);

                const { data: demosResult, error: demosFetchError } = await demoQuery.order('created_at', { ascending: false });

                if (demosFetchError) {
                    console.error("Error fetching filtered demos:", demosFetchError);
                    setIsLoading(false);
                    return;
                }

                const fetchedDemos = (demosResult as Demo[]) || [];
                const demoUrlsToCount = fetchedDemos.map(d => d.demo_url).filter(Boolean);

                // Fetch Likes for the Filtered Demos
                let likesByURL: { [url: string]: number } = {};
                if (demoUrlsToCount.length > 0) {
                    const { data: allLikesData, error: likesFetchError } = await supabase
                        .from('demo_likes')
                        .select('demo_url')
                        .in('demo_url', demoUrlsToCount);
                    if (likesFetchError) console.error("Error fetching demo likes:", likesFetchError);
                    else {
                        likesByURL = (allLikesData || []).reduce((acc, like) => {
                            acc[like.demo_url] = (acc[like.demo_url] || 0) + 1;
                            return acc;
                        }, {} as { [url: string]: number });
                    }
                }

                // Fetch User's Like Status
                let currentUserLikes: string[] = [];
                const { data: { user } } = await supabase.auth.getUser();
                if (user && demoUrlsToCount.length > 0) {
                    const { data: userLikesResult, error: userLikesError } = await supabase
                        .from('demo_likes')
                        .select('demo_url')
                        .eq('user_id', user.id)
                        .in('demo_url', demoUrlsToCount);
                    if (userLikesError) console.error("Error fetching user likes:", userLikesError);
                    else if (userLikesResult) currentUserLikes = userLikesResult.map(l => l.demo_url);
                }
                setUserLikes(currentUserLikes);

                // Combine Demos with Like Counts
                const demosWithLikes = fetchedDemos.map(demo => ({
                    ...demo,
                    likes: likesByURL[demo.demo_url] || 0
                }));
                setFilteredDemos(demosWithLikes);
            }
            setIsLoading(false);
        };
        performSearch();
    }, [viewMode, languageFilter, genderFilter, styleFilter]); // <-- Added viewMode to dependencies
    // Inside VoiceOverLandingPage component

const handleToggleLike = async (demo: Demo) => {
    const { data: { user } } = await supabase.auth.getUser();
    // Redirect to login if user is not logged in
    if (!user) {
        navigate('/client-auth'); // Or your preferred login route
        return;
    }

    const demoUrl = demo.demo_url;
    const isCurrentlyLiked = userLikes.includes(demoUrl);
    const actorId = demo.actors?.id; // Assuming actors object has an id

    // Prevent action if essential data is missing
     if (!actorId) {
         console.error("Cannot toggle like: Actor ID missing from demo object.");
         return;
     }


    if (isCurrentlyLiked) {
        // --- Unlike ---
        const { error } = await supabase.from('demo_likes')
            .delete()
            .match({ user_id: user.id, demo_url: demoUrl });

        if (error) {
            console.error("Error unliking demo:", error);
        } else {
            setUserLikes(prev => prev.filter(url => url !== demoUrl));
            // Update local count in filteredDemos state
            setFilteredDemos(prevDemos => prevDemos.map(d =>
                d.demo_url === demoUrl ? { ...d, likes: (d.likes || 1) - 1 } : d
            ));
        }
    } else {
        // --- Like ---
        const { error } = await supabase.from('demo_likes')
            .insert({
                user_id: user.id,
                actor_id: actorId, // Use the fetched actor ID
                demo_url: demoUrl
            });

        if (error) {
            console.error("Error liking demo:", error);
        } else {
            setUserLikes(prev => [...prev, demoUrl]);
            // Update local count in filteredDemos state
            setFilteredDemos(prevDemos => prevDemos.map(d =>
                d.demo_url === demoUrl ? { ...d, likes: (d.likes || 0) + 1 } : d
            ));
        }
    }
};

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
            Connect Directly.
            <br />
            <span className="text-5xl md:text-7xl">Find Your Voice.</span>
           </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            A platform connecting clients, creators, and professional voice actors.
            No middle-man, just pure talent.            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          {/* Changed link to anchor target */}
          <a href="#voices" className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 inline-flex items-center justify-center">
             <span className="relative flex items-center gap-2">
                <span>Browse Talent</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
             </span>
          </a>
          {/* Changed link to actor sign up */}
          <Link to="/actor-signup" className="group px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-full transition-all duration-300 hover:bg-white/20 hover:scale-105 inline-flex items-center justify-center">
             <div className="flex items-center gap-2">
               <UserPlus size={20} className="group-hover:rotate-12 transition-transform duration-300" />
               <span>Join the Roster</span>
             </div>
          </Link>          </div>
        </div>
      </section>     


    {/* --- NEW: Join Section --- */}
    <section id="join" className="py-20 bg-slate-800/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Join Our Platform</h2>
        <p className="text-slate-400 mb-12 max-w-2xl mx-auto">
          Whether you're a voice actor looking to manage your own career or a client searching for the perfect voice, our platform empowers direct connection.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Talents */}
          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-left transition-all duration-300 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/10">
            <h3 className="text-2xl font-semibold text-white mb-3">For Talents</h3>
            <p className="text-slate-400 mb-6">
              Showcase your portfolio, set your own rates, communicate directly with clients, and get paid directly to your bank account.
            </p>
            <Link to="/actor-signup" className="font-semibold text-purple-400 hover:text-purple-300 inline-flex items-center gap-2">
              Create Your Actor Profile <ArrowRight size={16} />
            </Link>
          </div>
          {/* For Clients */}
          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-left transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10">
            <h3 className="text-2xl font-semibold text-white mb-3">For Clients</h3>
            <p className="text-slate-400 mb-6">
              Browse a diverse roster, filter by your needs, listen to demos, and collaborate directly with the talent you hire.
            </p>
            <Link to="/client-auth" className="font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-2">
              Create a Client Account <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
    {/* --- END Join Section --- */}

          

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

          {/* --- NEW: View Mode Tabs --- */}
          <div className="flex justify-center mb-8 gap-2 p-1 bg-slate-800/50 border border-slate-700 rounded-lg max-w-xs mx-auto">
            <button
                onClick={() => setViewMode('actors')}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition ${
                    viewMode === 'actors' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-700'
                }`}
            >
                <Users size={16} /> Actors
            </button>
            <button
                onClick={() => setViewMode('demos')}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition ${
                    viewMode === 'demos' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-700'
                }`}
            >
                <List size={16} /> Demos
            </button>
          </div>

{/* --- MODIFIED: Filter controls --- */}
          <div className="flex flex-col gap-6 justify-center mb-12">

                        {/* Gender Filter */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm font-semibold text-slate-400 mr-2">Gender:</span>
                <button
                    onClick={() => setGenderFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                        genderFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                    All
                </button>
                {genderOptions.map(gen => (
                    <button
                        key={gen}
                        onClick={() => setGenderFilter(gen)}
                        className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                            genderFilter === gen ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {gen}
                    </button>
                ))}
            </div>

            {/* Language Filter */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm font-semibold text-slate-400 mr-2">Language:</span>
                <button
                    onClick={() => setLanguageFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                        languageFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                    All
                </button>
                {languageOptions.map(lang => (
                    <button
                        key={lang}
                        onClick={() => setLanguageFilter(lang)}
                        className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                            languageFilter === lang ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {lang}
                    </button>
                ))}
            </div>


            {/* Style Filter */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm font-semibold text-slate-400 mr-2">Style:</span>
                <button
                    onClick={() => setStyleFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                        styleFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                    All
                </button>
                {styleOptions.map(style => (
                    <button
                        key={style}
                        onClick={() => setStyleFilter(style)}
                        className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                            styleFilter === style ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {style}
                    </button>
                ))}
            </div>

            {/* Reset Button */}
            {isSearching && (
                <button onClick={handleResetFilters} className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 justify-center" title="Reset filters">
                    <RotateCcw size={16} />
                    Reset All Filters
                </button>
            )}
          </div>
          {/* --- END MODIFIED Filters --- */}
          
          {/* --- MODIFIED: Conditional Render Logic --- */}
                      {isLoading ? (
                          <p className="text-white text-center">Loading...</p>
                      ) : viewMode === 'actors' ? (
                          // --- Actor Grid View ---
                          actors.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                  {actors.map(actor => (
                                      actor.slug && <ActorCard key={actor.id} actor={actor} onPlayClick={handleSelectTrack} isCurrentlyPlaying={isPlaying && currentTrack?.url === actor.MainDemoURL} />
                                  ))}
                              </div>
                          ) : (
                              <p className="text-slate-500 text-center py-8">No actors found for your search criteria.</p>
                          )
                      ) : (
                          // --- Demo List View ---
                          <div className="max-w-3xl mx-auto space-y-4">
                              {filteredDemos.length > 0 ? (
                                  filteredDemos.map(demo => (
                                      <DemoPlayerRow
                                          key={demo.id}
                                          demo={demo}
                                          onPlayClick={handleSelectTrack}
                                          isLiked={userLikes.includes(demo.demo_url)}
                                          onToggleLike={handleToggleLike}
                                          isCurrentlyPlaying={isPlaying && currentTrack?.url === demo.demo_url}
                                      />
                                  ))
                              ) : (
                                  <p className="text-slate-500 text-center py-8">No demos found for your search criteria.</p>
                              )}
                          </div>
                      )}
                    {/* --- END MODIFIED Conditional Render --- */}                    
                </div>
            </section>

            <section className="py-20 bg-slate-900 border-t border-slate-800">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Support Our Platform</h2>
                    <p className="text-slate-400 mb-8">
                        We're committed to keeping this platform free and commission-free to empower direct relationships between clients and talent.
                        If you find this service valuable, please consider making a donation to help us cover server costs and continued development.
                    </p>
                    <a
                        href="https://donate.stripe.com/bJebIT61a9Lx2ax7OBebu08" // <-- PASTE YOUR LINK HERE
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 inline-flex items-center justify-center"
                    >
                        <span className="relative flex items-center gap-2">
                            <Heart size={20} />
                            <span>Donate to Keep Us Free</span>
                        </span>
                    </a>
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