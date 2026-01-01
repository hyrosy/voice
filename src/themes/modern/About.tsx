import React from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const About: React.FC<BlockProps> = ({ data }) => {
  // 1. CONFIGURATION
  const variant = data.variant || 'split'; // 'simple', 'split', 'profile'
  const isSimple = variant === 'simple';
  const isProfile = variant === 'profile';
  
  // Layout Alignment
  const mediaPosition = data.layout || 'left'; 
  const isMediaLeft = mediaPosition === 'left';

  // Helper to detect video files
  const isVideo = (url?: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov)$/i);
  };

  // --- SUB-COMPONENT: CINEMATIC MEDIA BLOCK ---
  const MediaBlock = () => {
    if (!data.image) return null;

    return (
      <div className={cn(
        "relative group mx-auto lg:mx-0 max-w-md",
        isSimple ? "hidden" : "block"
      )}>
         {/* Decorative Element Behind (The "Card" effect) */}
         <div className={cn(
             "absolute inset-0 bg-white/5 rounded-3xl transform translate-x-4 translate-y-4 transition-transform duration-500 group-hover:translate-x-6 group-hover:translate-y-6",
             "hidden md:block" // Hide on mobile to save space
         )} />

         {/* Main Media Container */}
         <div className="relative rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl aspect-[3/4] ring-1 ring-white/5">
            {isVideo(data.image) ? (
              <video
                src={data.image}
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img 
                src={data.image} 
                alt={data.title || "About Me"} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale-[20%] group-hover:grayscale-0"
                loading="lazy"
              />
            )}
            
            {/* Cinematic Shine Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
         </div>
      </div>
    );
  };

  // --- SUB-COMPONENT: STATS GRID (Cinematic Style) ---
  const StatsGrid = () => {
    if (!data.stats || data.stats.length === 0) return null;

    return (
      <div className="pt-8 border-t border-white/10 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-left">
            {data.stats.map((stat: any, idx: number) => (
                <div key={idx} className="space-y-1">
                    <h4 className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</h4>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">{stat.label}</p>
                </div>
            ))}
         </div>
      </div>
    );
  };

  // --- SUB-COMPONENT: FEATURES LIST (Dark Mode) ---
  const FeaturesList = () => {
    if (!data.features || data.features.length === 0) return null;

    return (
      <ul className="grid gap-3 pt-4 sm:grid-cols-2">
        {data.features.map((feature: string, idx: number) => (
          <li key={idx} className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary/60 mt-0.5 shrink-0" />
            <span className="text-sm md:text-base text-neutral-300">{feature}</span>
          </li>
        ))}
      </ul>
    );
  };

  // --- MAIN RENDER ---
  return (
    <section className="relative py-24 md:py-32 px-6 bg-neutral-950 overflow-hidden text-white">
      
       {/* === ATMOSPHERE LAYERS (From Old Design) === */}
       <div className="hidden md:block absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
       <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
       <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative container mx-auto z-10">
        
        {/* === VARIANT 1: SIMPLE (Centered) === */}
        {isSimple ? (
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
             {data.label && (
                <span className="text-primary font-mono text-sm tracking-widest uppercase inline-flex items-center gap-2 mb-2">
                   <span className="w-8 h-px bg-primary/50"></span>
                   {data.label}
                   <span className="w-8 h-px bg-primary/50"></span>
                </span>
             )}
             
             <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
               {data.title}
             </h2>

             <div className="h-1 w-24 mx-auto bg-gradient-to-r from-primary to-transparent" />

             <div className="prose prose-lg prose-invert mx-auto text-neutral-400 leading-relaxed whitespace-pre-wrap">
                {data.content}
             </div>
             
             {/* Features Centered */}
             {data.features && data.features.length > 0 && (
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 pt-4">
                    {data.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-neutral-300">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span>{feature}</span>
                        </div>
                    ))}
                </div>
             )}

             {data.ctaText && (
               <div className="pt-8">
                  <Button asChild size="lg" className="rounded-full px-10 h-14 text-base bg-white text-black hover:bg-neutral-200 hover:scale-105 transition-all">
                    <a href={data.ctaLink || "#"}>
                      {data.ctaText} <ArrowRight className="ml-2 w-4 h-4" />
                    </a>
                  </Button>
               </div>
             )}
          </div>

        ) : (
          
        /* === VARIANT 2 & 3: SPLIT & PROFILE (Grid) === */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            
            {/* COLUMN: MEDIA */}
            <div className={cn(
               "transition-all duration-1000 ease-out",
               // Desktop Order
               isMediaLeft ? "lg:order-1" : "lg:order-2",
               // Mobile Order (Media First)
               "order-1" 
            )}>
               <MediaBlock />
            </div>

            {/* COLUMN: CONTENT */}
            <div className={cn(
              "space-y-8",
              isMediaLeft ? "lg:order-2" : "lg:order-1",
              "order-2"
            )}>
               <div className="space-y-6">
                  {data.label && (
                    <span className="text-primary font-mono text-sm tracking-widest uppercase flex items-center gap-3">
                       <span className="w-8 h-px bg-primary"></span>
                       {data.label}
                    </span>
                  )}
                  
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
                    {data.title}
                  </h2>
                  
                  <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent" />
               </div>

               <div className="prose prose-lg prose-invert text-neutral-400 leading-relaxed whitespace-pre-wrap font-light">
                 {data.content}
               </div>

               {/* Features (Split Variant) */}
               {!isProfile && <FeaturesList />}

               {/* Stats (Profile Variant) */}
               {isProfile && <StatsGrid />}

               {/* CTA Button */}
               {data.ctaText && (
                 <div className="pt-4">
                    <Button asChild size="lg" className="h-12 px-8 rounded-full bg-white text-black hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                      <a href={data.ctaLink || "#"}>
                        {data.ctaText}
                      </a>
                    </Button>
                 </div>
               )}
            </div>

          </div>
        )}
      </div>
    </section>
  );
};

export default About;