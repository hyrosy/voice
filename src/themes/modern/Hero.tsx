// In src/themes/modern/Hero.tsx

import React from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown } from 'lucide-react'; // Ensure lucide-react is installed

const Hero: React.FC<BlockProps> = ({ data }) => {
  // Enhanced Alignment Logic
  const alignmentClass = data.alignment === 'left' ? 'text-left items-start' : 
                         data.alignment === 'right' ? 'text-right items-end' : 
                         'text-center items-center';

  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden bg-black text-white">
       
       {/* --- LAYER 1: BACKGROUND --- */}
       {data.backgroundImage ? (
          <div className="absolute inset-0 z-0">
             {/* The Ken Burns Effect: Slow zoom animation */}
             <div className="absolute inset-0 overflow-hidden">
                <img 
                    src={data.backgroundImage} 
                    alt="Hero Background" 
                    className="w-full h-full object-cover animate-ken-burns scale-100 opacity-90" 
                    style={{ animationDuration: '20s' }}
                    loading="eager" // Hero should load fast
                    decoding="sync"
                />
             </div>
             
             {/* Gradient Overlay for Text Readability */}
             {/* We use a gradient instead of flat black to keep the image visible but text sharp */}
             <div 
                className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-neutral-950" 
                style={{ opacity: (data.overlayOpacity || 60) / 100 }} 
             />
             
             {/* Noise/Grain Texture - The "Cinematic" Secret Sauce */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
          </div>
       ) : (
          // Fallback if no image
          <div className="absolute inset-0 bg-neutral-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 to-neutral-950" />
       )}
       
       {/* --- LAYER 2: CONTENT --- */}
       <div className={cn("relative z-10 container h-full flex flex-col justify-center px-6 pt-20", alignmentClass)}>
          <div className={cn("space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both", 
              data.alignment === 'center' ? 'max-w-4xl' : 'max-w-3xl'
          )}>
             
             {/* Eyebrow Label (Optional) - Adds hierarchy */}
             <div className="overflow-hidden">
                <span className="inline-block py-1 px-3 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-xs md:text-sm font-medium tracking-widest uppercase text-white/80 animate-fade-up">
                    {data.label || "Welcome"}
                </span>
             </div>

             {/* Headline */}
             <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] md:leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-sm">
                {data.headline}
             </h1>

             {/* Subheadline */}
             <p className="text-lg md:text-2xl text-white/80 font-light leading-relaxed max-w-2xl text-shadow-sm">
                {data.subheadline}
             </p>

             {/* CTA Button */}
             {data.ctaText && (
                <div className="pt-4 md:pt-8">
                    <Button 
                        asChild 
                        size="lg" 
                        className="h-14 md:h-16 px-8 md:px-10 rounded-full bg-white text-black hover:bg-neutral-200 text-base md:text-lg font-semibold transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] group"
                    >
                       <a href={data.ctaLink || "#contact"} className="flex items-center gap-2">
                          {data.ctaText} 
                          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                       </a>
                    </Button>
                </div>
             )}
          </div>
       </div>

       {/* --- LAYER 3: SCROLL INDICATOR --- */}
       <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center animate-bounce-slow opacity-70">
           <a href="#content" className="flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors cursor-pointer">
               <span className="text-[10px] uppercase tracking-widest">Scroll</span>
               <ChevronDown className="w-6 h-6" />
           </a>
       </div>

    </section>
  );
};

export default Hero;