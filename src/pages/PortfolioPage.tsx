import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Demo as DemoInterface, 
  VideoDemoCard, 
  ScriptDemoCard 
} from '@/components/DemoCards';
import TalentCard from '../components/TalentCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import DemoPlayerRow from '../components/DemoPlayerRow'; 
import GlobalAudioPlayer from '../components/GlobalAudioPlayer';

interface Actor {
  slug: string;
  HeadshotURL: string | null;
  ActorName: string;
  bio: string | null;
  service_scriptwriting: boolean;
  service_videoediting: boolean;
  service_voiceover: boolean;
}

interface CurrentTrack {
  url: string;
  actor: {
    ActorName: string;
    HeadshotURL: string;
  }
}

const PortfolioPage: React.FC = () => {
  const [allDemos, setAllDemos] = useState<DemoInterface[]>([]);
  const [filteredDemos, setFilteredDemos] = useState<DemoInterface[]>([]);
  const [allActors, setAllActors] = useState<Actor[]>([]);
  
  const [currentFilter, setCurrentFilter] = useState<'all' | 'audio' | 'video' | 'script'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [userLikes, setUserLikes] = useState<string[]>([]);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      
      // Fetch Demos
      const { data: demoData, error: demoError } = await supabase.rpc('get_all_demos');
      
      // Fetch Actors
      const { data: actorData, error: actorError } = await supabase
        .from('actors')
        .select(`
          slug, HeadshotURL, ActorName, bio, service_scriptwriting, service_videoediting, service_voiceover, IsActive
        `)
        .eq('IsActive', true);

      if (demoError || actorError) {
        console.error("Error fetching data:", demoError, actorError);
        setError("Could not load content. Please try again later.");
      } else {
        // 1. Process Actors
        const actors = actorData.map((actor: any) => ({
          ...actor,
          service_voiceover: actor.service_voiceover ?? true 
        })) as Actor[];
        
        const activeActors = actors.filter(actor => 
            actor.service_voiceover || actor.service_scriptwriting || actor.service_videoediting
        );
        setAllActors(activeActors);

        // 2. Filter Demos
        const validDemos = (demoData as DemoInterface[]).filter(demo => {
            const actor = actors.find(a => a.slug === demo.actor_slug); 
            if (!actor) return false; 

            if (demo.demo_type === 'audio' && !actor.service_voiceover) return false;
            if (demo.demo_type === 'video' && !actor.service_videoediting) return false;
            if (demo.demo_type === 'script' && !actor.service_scriptwriting) return false;
            return true;
        });

        // 3. Fetch and Merge Like Counts
        const demoUrls = validDemos.map(d => d.demo_url).filter(Boolean) as string[];
        let likesByURL: { [url: string]: number } = {};
        
        if (demoUrls.length > 0) {
            const { data: allLikesData } = await supabase
                .from('demo_likes')
                .select('demo_url')
                .in('demo_url', demoUrls);
            
            if (allLikesData) {
                likesByURL = allLikesData.reduce((acc: any, like: any) => {
                    acc[like.demo_url] = (acc[like.demo_url] || 0) + 1;
                    return acc;
                }, {});
            }
        }

        const demosWithLikes = validDemos.map(d => ({
            ...d,
            likes: d.demo_url ? (likesByURL[d.demo_url] || 0) : 0
        }));
        
        setAllDemos(demosWithLikes);
        
        // --- KEY FIX: Initialize filteredDemos immediately ---
        // This ensures the UI shows the data right away, instead of waiting for the filter effect
        if (currentFilter !== 'all') {
             setFilteredDemos(demosWithLikes.filter(demo => demo.demo_type === currentFilter));
        }
        // ----------------------------------------------------

        // 4. Fetch User Likes
        const { data: { user } } = await supabase.auth.getUser();
        if (user && demoUrls.length > 0) {
            const { data: userLikesData } = await supabase
                .from('demo_likes')
                .select('demo_url')
                .eq('user_id', user.id)
                .in('demo_url', demoUrls);
                
            if (userLikesData) {
                setUserLikes(userLikesData.map(l => l.demo_url));
            }
        }
      }
      setIsLoading(false);
    };

    fetchAllData();
  }, []); // Empty dependency array - runs once on mount

  // Filter Effect (Updates when user changes tabs)
  useEffect(() => {
    if (currentFilter === 'all') {
      setFilteredDemos([]); 
    } else {
      setFilteredDemos(allDemos.filter(demo => demo.demo_type === currentFilter));
    }
  }, [currentFilter, allDemos]);


  // --- Audio Player Handlers ---
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
    if (isPlaying) audioRef.current?.play().catch(console.error);
    else audioRef.current?.pause();
  }, [isPlaying, currentTrack]);

  const handlePlayClick = (demo: any) => { 
    if (!demo.demo_url) return;

    const actorName = demo.actors?.ActorName || demo.actor_name;
    const headshot = demo.actors?.HeadshotURL || demo.actor_headshot;

    const newTrack = {
        url: demo.demo_url,
        actor: { ActorName: actorName, HeadshotURL: headshot }
    };

    if (currentTrack?.url === newTrack.url) {
        setIsPlaying(!isPlaying);
    } else {
        setCurrentTrack(newTrack);
        setIsPlaying(true);
    }
  };

  // --- Like Handler (Corrected to update BOTH states) ---
  const handleToggleLike = async (demo: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; 

      const demoUrl = demo.demo_url;
      const isLiked = userLikes.includes(demoUrl);
      
      // 1. Optimistic UI Update
      if (isLiked) {
          setUserLikes(prev => prev.filter(u => u !== demoUrl));
          // Update allDemos AND filteredDemos
          const updateDemos = (demos: DemoInterface[]) => demos.map(d => 
            d.demo_url === demoUrl ? { ...d, likes: (d.likes || 1) - 1 } : d
          );
          setAllDemos(prev => updateDemos(prev));
          setFilteredDemos(prev => updateDemos(prev)); // <-- IMPORTANT: Update filtered list too
      } else {
          setUserLikes(prev => [...prev, demoUrl]);
          const updateDemos = (demos: DemoInterface[]) => demos.map(d => 
            d.demo_url === demoUrl ? { ...d, likes: (d.likes || 0) + 1 } : d
          );
          setAllDemos(prev => updateDemos(prev));
          setFilteredDemos(prev => updateDemos(prev)); // <-- IMPORTANT: Update filtered list too
      }

      // 2. Database Call
      if (isLiked) {
          await supabase.from('demo_likes').delete().match({ user_id: user.id, demo_url: demoUrl });
      } else {
          const actorId = demo.actors?.id || demo.actor_id;
          await supabase.from('demo_likes').insert({ user_id: user.id, actor_id: actorId, demo_url: demoUrl });
      }
  };


  const renderOtherDemoCard = (demo: DemoInterface) => {
    switch (demo.demo_type) {
      case 'video':
        return <VideoDemoCard key={demo.demo_id} demo={demo} />;
      case 'script':
        return <ScriptDemoCard key={demo.demo_id} demo={demo} />;
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-12 pb-32 pt-24 pt-20 md:pt-0"> 
      
      <audio ref={audioRef} src={currentTrack?.url || ''} />

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Our Talent & Demos
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Browse our marketplace by talent, or listen to the latest demos for audio, video, and scripts.
        </p>
      </div>

      <Tabs 
        value={currentFilter} 
        onValueChange={(value) => setCurrentFilter(value as any)} 
        className="w-full mb-8"
      >
        <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto mb-8">
          <TabsTrigger value="all">All Talent</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="script">Scripts</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="rounded-xl aspect-[3/4]" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive" className="max-w-xl mx-auto">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allActors.map(actor => (
                  <TalentCard key={actor.slug} actor={actor} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="audio" className="mt-0">
              <div className="max-w-3xl mx-auto space-y-4"> 
                {filteredDemos.length > 0 ? (
                  filteredDemos.map(demo => {
                    // Transform DemoInterface to match DemoPlayerRow's expected prop shape
                    const rowDemo = {
                        id: demo.demo_id,
                        title: demo.demo_title,
                        demo_url: demo.demo_url || '',
                        likes: demo.likes || 0, 
                        actors: {
                            id: demo.actor_id,
                            ActorName: demo.actor_name,
                            slug: demo.actor_slug,
                            HeadshotURL: demo.actor_headshot
                        }
                    };

                    return (
                        <DemoPlayerRow
                            key={demo.demo_id}
                            demo={rowDemo}
                            onPlayClick={() => handlePlayClick(demo)}
                            isCurrentlyPlaying={isPlaying && currentTrack?.url === demo.demo_url}
                            isLiked={userLikes.includes(demo.demo_url || '')}
                            onToggleLike={() => handleToggleLike(demo)}
                        />
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground col-span-full py-12">
                    No audio demos found.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDemos.length > 0 ? (
                  filteredDemos.map(renderOtherDemoCard)
                ) : (
                  <p className="text-center text-muted-foreground col-span-full py-12">
                    No video demos found.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="script" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDemos.length > 0 ? (
                  filteredDemos.map(renderOtherDemoCard)
                ) : (
                  <p className="text-center text-muted-foreground col-span-full py-12">
                    No script demos found.
                  </p>
                )}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      <GlobalAudioPlayer
        audioRef={audioRef}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => {
            if (currentTrack) setIsPlaying(!isPlaying);
        }}
        duration={duration}
        currentTime={currentTime}
      />
    </div>
  );
};

export default PortfolioPage;