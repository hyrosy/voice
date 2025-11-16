// In src/pages/PortfolioPage.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Demo, 
  AudioDemoCard, 
  VideoDemoCard, 
  ScriptDemoCard 
} from '@/components/DemoCards';
import TalentCard from '../components/TalentCard'; // <-- 1. Import our new card
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"; // <-- 2. Import Skeleton

// Define the actor type
interface Actor {
  slug: string;
  HeadshotURL: string | null;
  ActorName: string;
  bio: string | null;
  service_scriptwriting: boolean;
  service_videoediting: boolean;
  service_voiceover: boolean; // We'll add this
}

const PortfolioPage: React.FC = () => {
  // Demos State
  const [allDemos, setAllDemos] = useState<Demo[]>([]);
  const [filteredDemos, setFilteredDemos] = useState<Demo[]>([]);
  
  // Actors State
  const [allActors, setAllActors] = useState<Actor[]>([]); // <-- 3. Add state for actors

  const [currentFilter, setCurrentFilter] = useState<'all' | 'audio' | 'video' | 'script'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 4. Fetch *both* demos and actors
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      
      // Fetch Demos (existing logic)
      const { data: demoData, error: demoError } = await supabase.rpc('get_all_demos');
      
      // Fetch Actors (new logic)
      const { data: actorData, error: actorError } = await supabase
        .from('actors')
        .select(`
          slug, 
          HeadshotURL, 
          ActorName, 
          bio, 
          service_scriptwriting, 
          service_videoediting,
          IsActive
        `)
        .eq('IsActive', true); // Only show active actors

      if (demoError || actorError) {
        console.error("Error fetching data:", demoError, actorError);
        setError("Could not load content. Please try again later.");
      } else {
        setAllDemos(demoData as Demo[]);
        // Add the 'service_voiceover' property
        const actorsWithVO = actorData.map(actor => ({
          ...actor,
          service_voiceover: true 
        }));
        setAllActors(actorsWithVO);
      }
      setIsLoading(false);
    };

    fetchAllData();
  }, []);

  // 5. Update filtering logic
  useEffect(() => {
    if (currentFilter === 'all') {
      setFilteredDemos([]); // We're showing actors, so clear the demos
    } else {
      // This is your existing logic, it's perfect
      setFilteredDemos(allDemos.filter(demo => demo.demo_type === currentFilter));
    }
  }, [currentFilter, allDemos]);

// --- 2. NEW: Helper function to render the correct card ---
  const renderDemoCard = (demo: Demo) => {
    switch (demo.demo_type) {
      case 'audio':
        return <AudioDemoCard key={demo.demo_id} demo={demo} />;
      case 'video':
        return <VideoDemoCard key={demo.demo_id} demo={demo} />;
      case 'script':
        return <ScriptDemoCard key={demo.demo_id} demo={demo} />;
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Our Talent & Demos
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Browse our marketplace by talent, or listen to the latest demos
          for audio, video, and scripts.
        </p>
      </div>

      <Tabs 
        value={currentFilter} 
        onValueChange={(value) => setCurrentFilter(value as any)} 
        className="w-full mb-8"
      >
        <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto">
          <TabsTrigger value="all">All Talent</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="script">Scripts</TabsTrigger>
        </TabsList>

        {/* --- 3. UPDATED: Content Section --- */}
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
            {/* --- "ALL TALENT" TAB (Correct) --- */}
            <TabsContent value="all">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allActors.map(actor => (
                  <TalentCard key={actor.slug} actor={actor} />
                ))}
              </div>
            </TabsContent>

            {/* --- "AUDIO" TAB (Uses new render function) --- */}
            <TabsContent value="audio">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDemos.length > 0 ? (
                  filteredDemos.map(renderDemoCard)
                ) : (
                  <p className="text-center text-muted-foreground col-span-full">
                    No audio demos found.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* --- "VIDEO" TAB (Uses new render function) --- */}
            <TabsContent value="video">
              {/* As per your idea, we can use a different grid for videos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDemos.length > 0 ? (
                  filteredDemos.map(renderDemoCard)
                ) : (
                  <p className="text-center text-muted-foreground col-span-full">
                    No video demos found.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* --- "SCRIPT" TAB (Uses new render function) --- */}
            <TabsContent value="script">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDemos.length > 0 ? (
                  filteredDemos.map(renderDemoCard)
                ) : (
                  <p className="text-center text-muted-foreground col-span-full">
                    No script demos found.
                  </p>
                )}
              </div>
            </TabsContent>
          </>
        )}
              </Tabs>
            </div>
  );

};

export default PortfolioPage;