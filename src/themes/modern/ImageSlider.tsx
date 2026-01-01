import React, { useState, useEffect, useCallback } from 'react';
import { BlockProps } from '../types';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

const ImageSlider: React.FC<BlockProps> = ({ data }) => {
  const [current, setCurrent] = useState(0);
  const images = data.images || [];
  const variant = data.variant || 'standard'; // standard, cinematic, cards
  const intervalTime = (data.interval || 5) * 1000;
  const autoPlayEnabled = intervalTime > 0;

  // Height Classes
  const heightClass = 
    data.height === 'full' ? 'h-[100dvh]' : 
    data.height === 'medium' ? 'h-[400px] md:h-[500px]' : 
    'h-[600px] md:h-[700px]';

  // --- NAVIGATION LOGIC ---
  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  // --- AUTOPLAY ---
  useEffect(() => {
    if (!autoPlayEnabled) return;
    const timer = setInterval(nextSlide, intervalTime);
    return () => clearInterval(timer);
  }, [autoPlayEnabled, intervalTime, nextSlide]);


  if (images.length === 0) return null;

  return (
    <section className="bg-neutral-950 relative overflow-hidden group">
        
      {/* Title Overlay (Optional) */}
      {data.title && (
         <div className="absolute top-8 left-0 right-0 z-20 text-center pointer-events-none">
            <span className="inline-block py-1 px-4 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white text-sm font-medium tracking-widest uppercase">
                {data.title}
            </span>
         </div>
      )}

      {/* === VARIANT 1: STANDARD (Swipe) === */}
      {variant === 'standard' && (
        <div className={cn("relative w-full", heightClass)}>
           {images.map((slide: any, idx: number) => (
             <div 
               key={idx}
               className={cn(
                 "absolute inset-0 transition-opacity duration-700 ease-in-out",
                 idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
               )}
             >
                <img 
                   src={slide.url} 
                   alt={slide.caption} 
                   className="w-full h-full object-cover" 
                />
                {/* Caption */}
                {slide.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-lg md:text-xl font-light text-center">{slide.caption}</p>
                    </div>
                )}
             </div>
           ))}
        </div>
      )}

      {/* === VARIANT 2: CINEMATIC (Ken Burns Fade) === */}
      {variant === 'cinematic' && (
         <div className={cn("relative w-full", heightClass)}>
            {images.map((slide: any, idx: number) => (
              <div 
                key={idx}
                className={cn(
                  "absolute inset-0 transition-all duration-[2000ms] ease-in-out",
                  idx === current ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-110"
                )}
              >
                 {/* The Image Itself - Scale Animation happens here if active */}
                 <img 
                    src={slide.url} 
                    alt={slide.caption} 
                    className={cn(
                        "w-full h-full object-cover transition-transform duration-[10000ms] ease-linear",
                        idx === current ? "scale-110" : "scale-100"
                    )} 
                 />
                 <div className="absolute inset-0 bg-black/20" /> {/* Subtle overlay */}
                 
                 {/* Caption (Cinematic style) */}
                 {slide.caption && (
                     <div className="absolute bottom-12 left-8 md:left-12 max-w-lg">
                         <div className="h-1 w-12 bg-primary mb-4" />
                         <p className="text-white text-2xl md:text-4xl font-bold tracking-tight shadow-black drop-shadow-lg leading-tight">
                            {slide.caption}
                         </p>
                     </div>
                 )}
              </div>
            ))}
         </div>
      )}

      {/* === VARIANT 3: CARDS (Focus Mode) === */}
      {variant === 'cards' && (
          <div className={cn("relative w-full flex items-center justify-center bg-neutral-900", heightClass)}>
              <div className="relative w-full max-w-6xl mx-auto h-[80%] px-4 perspective-1000">
                  {images.map((slide: any, idx: number) => {
                      // Logic to determine position relative to current
                      let position = 'hidden';
                      if (idx === current) position = 'center';
                      else if (idx === (current - 1 + images.length) % images.length) position = 'left';
                      else if (idx === (current + 1) % images.length) position = 'right';

                      return (
                          <div 
                            key={idx}
                            className={cn(
                                "absolute top-0 bottom-0 w-[70%] md:w-[60%] left-0 right-0 mx-auto transition-all duration-500 ease-out shadow-2xl rounded-xl overflow-hidden border border-white/10",
                                position === 'center' && "z-20 opacity-100 scale-100 translate-x-0",
                                position === 'left' && "z-10 opacity-40 scale-90 -translate-x-[60%] blur-[1px]",
                                position === 'right' && "z-10 opacity-40 scale-90 translate-x-[60%] blur-[1px]",
                                position === 'hidden' && "z-0 opacity-0 scale-75"
                            )}
                          >
                                <img src={slide.url} alt={slide.caption} className="w-full h-full object-cover" />
                                {position === 'center' && slide.caption && (
                                    <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-lg text-white text-center">
                                        {slide.caption}
                                    </div>
                                )}
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* --- CONTROLS (Arrows & Dots) --- */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4 z-30">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevSlide}
            className="pointer-events-auto h-12 w-12 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-sm transition-all hover:scale-110"
          >
              <ChevronLeft className="w-8 h-8" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextSlide}
            className="pointer-events-auto h-12 w-12 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-sm transition-all hover:scale-110"
          >
              <ChevronRight className="w-8 h-8" />
          </Button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-30 pointer-events-none">
         {images.map((_: any, idx: number) => (
             <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300 pointer-events-auto",
                    idx === current ? "bg-white w-6" : "bg-white/40 hover:bg-white/80"
                )}
             />
         ))}
      </div>

    </section>
  );
};

export default ImageSlider;