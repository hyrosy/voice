// In src/themes/modern/ImageSlider.tsx

import React, { useState, useEffect } from 'react';
import { BlockProps } from '../types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

const ImageSlider: React.FC<BlockProps> = ({ data }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  if (!data.images || data.images.length === 0) return null;

  const heightClass = data.height === 'full' ? 'h-[100dvh]' : 
                      data.height === 'medium' ? 'h-[400px] md:h-[500px]' : 
                      'h-[600px] md:h-[700px]';

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const plugins = React.useMemo(() => {
    if (data.autoplay && data.interval > 0) {
      return [Autoplay({ delay: data.interval * 1000, stopOnInteraction: false })];
    }
    return [];
  }, [data.autoplay, data.interval]);

  const currentImage = data.images[current - 1] || data.images[0];

  return (
    <section className={cn("relative w-full overflow-hidden bg-black", heightClass)}>
      
      {/* --- LAYER 1: AMBIENT BACKGROUND --- */}
      {/* FIX 1: Heavy blur hidden on mobile ('hidden md:block'). 
          Re-rendering this blur (key={current}) on every slide change kills mobile FPS. 
      */}
      <div className="hidden md:block absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out">
        <div 
            key={current}
            className="absolute inset-0 bg-cover bg-center blur-3xl scale-110 opacity-50 animate-pulse-slow"
            style={{ backgroundImage: `url(${currentImage.url})` }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Mobile Fallback Background (Simple & Fast) */}
      <div className="absolute inset-0 bg-neutral-950 md:hidden z-0" />

      {/* --- LAYER 2: CAROUSEL CONTENT --- */}
      <div className="relative z-10 h-full flex flex-col justify-center">
        
        {/* Mobile Header */}
        <div className="absolute top-6 right-6 z-20 md:hidden">
            <span className="bg-black/40 backdrop-blur-md text-white/80 px-3 py-1 rounded-full text-xs font-mono border border-white/10">
                {current} / {count}
            </span>
        </div>

        {/* Desktop Header */}
        {data.title && (
          <div className="absolute top-8 left-0 w-full z-20 px-8 hidden md:flex justify-between items-center">
             <h2 className="text-white font-bold tracking-widest uppercase text-sm border-l-2 border-white pl-4">
               {data.title}
             </h2>
             <span className="text-white/60 text-xs font-mono">
                {current.toString().padStart(2, '0')} / {count.toString().padStart(2, '0')}
             </span>
          </div>
        )}

        <Carousel
          setApi={setApi}
          plugins={plugins}
          className="w-full h-full"
          opts={{
            align: "center",
            loop: true,
            // Embla doesn't use 'cssMode' prop like Swiper, but removing the heavy background
            // ensures the JS animation runs smoothly at 60fps on mobile.
          }}
        >
          <CarouselContent className="-ml-0 h-full">
            {data.images.map((img: any, index: number) => (
              <CarouselItem key={index} className="pl-0 w-full h-full relative">
                 
                 <div className="w-full h-full flex items-center justify-center p-2 md:p-12 lg:p-16">
                    
                    {/* FIX 2: Removed shadow on mobile container */}
                    <div className="relative w-full h-full overflow-hidden rounded-2xl md:rounded-[2rem] shadow-none md:shadow-2xl bg-neutral-900 group">
                        <img 
                            src={img.url} 
                            alt={img.caption || `Slide ${index + 1}`} 
                            // FIX 3: Async decoding and GPU hint
                            decoding="async"
                            loading={index === 0 ? "eager" : "lazy"}
                            className="w-full h-full object-cover transition-transform duration-[3000ms] ease-out group-hover:scale-110 will-change-transform"
                        />
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 md:opacity-80 pointer-events-none" />

                        {/* Caption Box */}
                        <div className="absolute bottom-0 left-0 w-full p-6 md:p-16 flex flex-col justify-end h-full pointer-events-none">
                            <div className="max-w-4xl space-y-2 md:space-y-4 translate-y-0 transition-transform duration-500">
                                {img.caption && (
                                    <h3 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg">
                                        {img.caption}
                                    </h3>
                                )}
                                {img.description && (
                                    <p className="text-white/80 text-sm md:text-lg line-clamp-3 md:line-clamp-2 max-w-xl md:leading-relaxed">
                                        {img.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                 </div>

              </CarouselItem>
            ))}
          </CarouselContent>
          
          <div className="absolute bottom-12 right-12 z-30 hidden md:flex gap-4">
            <CarouselPrevious className="static translate-y-0 h-14 w-14 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black backdrop-blur-md transition-all" />
            <CarouselNext className="static translate-y-0 h-14 w-14 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black backdrop-blur-md transition-all" />
          </div>

        </Carousel>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 md:h-1.5 bg-white/10 z-20">
            <div 
                className="h-full bg-white transition-all duration-500 ease-out box-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                style={{ width: `${(current / count) * 100}%` }}
            />
        </div>

      </div>
    </section>
  );
};

export default ImageSlider;