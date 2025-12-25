// In src/themes/modern/VideoSlider.tsx

import React from 'react';
import { BlockProps } from '../types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react"; 

// --- PLAYER FIX ---
import ReactPlayerOriginal from 'react-player';
const ReactPlayer = ReactPlayerOriginal as any;
// ------------------

interface VideoSlide {
  url: string;
  title?: string;
  poster?: string;
  description?: string; 
}

const VideoSlider: React.FC<BlockProps> = ({ data }) => {
  if (!data.videos || !Array.isArray(data.videos) || data.videos.length === 0) return null;

  // Simplified height logic
  const heightMap = {
    full: 'h-[80vh]',
    medium: 'h-[500px]',
    default: 'h-[600px]'
  };
  
  const heightClass = heightMap[data.height as keyof typeof heightMap] || heightMap.default;

  return (
    <section className="relative w-full py-20 bg-neutral-950 overflow-hidden">
      
      {/* Ambient Background Glow */}
      {/* FIX 1: Hide heavy blur on mobile. This is the #1 performance saver for carousels. */}
      <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl bg-neutral-900/20 blur-3xl pointer-events-none rounded-full opacity-50" />

      <div className="container relative mx-auto px-4 z-10">
        
        {/* Header Section */}
        {data.title && (
          <div className="mb-12 text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              {data.title}
            </h2>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full opacity-80" />
          </div>
        )}

        <Carousel
          className="w-full max-w-[95%] mx-auto"
          opts={{
            align: "center",
            loop: true,
          }}
        >
          <CarouselContent className="-ml-4">
            {data.videos.map((vid: VideoSlide, index: number) => (
              <CarouselItem 
                key={index} 
                className="pl-4 basis-full md:basis-[85%] lg:basis-[70%] xl:basis-[60%]"
              >
                <div className={cn(
                  // FIX 2: Simplified border/shadow on mobile to reduce repaint cost during swipe
                  "group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-none md:shadow-2xl transition-all duration-300 hover:shadow-primary/10 hover:border-white/20", 
                  heightClass
                )}>
                  
                  {/* Video Player Wrapper */}
                  <div className="absolute inset-0 w-full h-full bg-black">
                    <ReactPlayer
                      url={vid.url || ''}
                      width="100%"
                      height="100%"
                      controls={true}
                      playing={false}
                      // Light mode creates a thumbnail image instead of loading the full iframe immediately.
                      // This is crucial for performance.
                      light={vid.poster ? vid.poster : true}
                      playIcon={
                        // Custom Play Button Styling
                        // FIX 3: Added 'will-change-transform' for smoother hover scaling
                        <button className="group/play relative flex items-center justify-center h-20 w-20 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 transition-transform duration-300 hover:scale-110 hover:bg-white/20 shadow-lg will-change-transform">
                           <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </button>
                      }
                      config={{
                        file: {
                          attributes: {
                            controlsList: 'nodownload',
                            style: { objectFit: 'cover', width: '100%', height: '100%' }
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Gradient Scrim (Overlay) for Text Readability */}
                  <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                  {/* Text Content */}
                  {vid.title && (
                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 pointer-events-none">
                      <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md mb-2">
                        {vid.title}
                      </h3>
                      {vid.description && (
                        <p className="text-white/80 text-sm md:text-base max-w-lg line-clamp-2">
                          {vid.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Arrows */}
          <div className="hidden md:block">
            <CarouselPrevious className="left-[-3rem] h-14 w-14 bg-neutral-800/50 border-white/10 text-white hover:bg-white hover:text-black backdrop-blur-md transition-colors" />
            <CarouselNext className="right-[-3rem] h-14 w-14 bg-neutral-800/50 border-white/10 text-white hover:bg-white hover:text-black backdrop-blur-md transition-colors" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default VideoSlider;