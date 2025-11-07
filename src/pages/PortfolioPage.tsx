import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Demo } from '../components/DemoCard';
import DemoCard from '../components/DemoCard'; // Import the new component
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';

// This is a placeholder for your global audio player logic
// You can integrate this with your existing GlobalAudioPlayer
const useDemoPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  
  const handlePlayClick = (demo: Demo) => {
    console.log("Playing demo:", demo.demo_url);
    // Add logic here to set track in your GlobalAudioPlayer
    // For now, we'll just log it.
    // setCurrentTrack(demo.demo_url);
  };

  return { currentTrack, handlePlayClick };
};


const PortfolioPage: React.FC = () => {
  const [allDemos, setAllDemos] = useState<Demo[]>([]);
  const [filteredDemos, setFilteredDemos] = useState<Demo[]>([]);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'audio' | 'video' | 'script'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { handlePlayClick } = useDemoPlayer();

  // 1. Fetch all demos on component mount
  useEffect(() => {
    const fetchDemos = async () => {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase.rpc('get_all_demos');

      if (error) {
        console.error("Error fetching demos:", error);
        setError("Could not load demos at this time. Please try again later.");
      } else if (data) {
        setAllDemos(data as Demo[]);
        setFilteredDemos(data as Demo[]); // Initially, show all
      }
      setIsLoading(false);
    };

    fetchDemos();
  }, []);

  // 2. Filter demos when the filter or data changes
  useEffect(() => {
    if (currentFilter === 'all') {
      setFilteredDemos(allDemos);
    } else {
      setFilteredDemos(allDemos.filter(demo => demo.demo_type === currentFilter));
    }
  }, [currentFilter, allDemos]);

  return (
    <div className="container max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Demo Gallery
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Browse the latest audio, video, and script demos from our entire roster of talent.
        </p>
      </div>

      <Tabs 
        value={currentFilter} 
        onValueChange={(value) => setCurrentFilter(value as any)} 
        className="w-full mb-8"
      >
        <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="script">Scripts</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content Area */}
      <div>
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading demos...</p>
          // TODO: Add Skeleton loaders here
        ) : error ? (
          <Alert variant="destructive" className="max-w-xl mx-auto">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : filteredDemos.length === 0 ? (
          <Alert className="max-w-xl mx-auto">
            <Info className="h-4 w-4" />
            <AlertTitle>No Demos Found</AlertTitle>
            <AlertDescription>
              There are no demos matching this filter.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDemos.map(demo => (
            <DemoCard key={demo.demo_id} demo={demo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;