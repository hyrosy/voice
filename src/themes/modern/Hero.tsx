import React from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown, Play } from 'lucide-react';

const Hero: React.FC<BlockProps> = ({ data }) => {
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

   const alignmentClass = data.alignment === 'left' ? 'text-left items-start' : 
                         data.alignment === 'right' ? 'text-right items-end' : 
                         'text-center items-center';

  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden bg-black text-white">
       
       {/* --- LAYER 1: BACKGROUND MEDIA --- */}
       <div className="absolute inset-0 z-0">
             {/* A. VIDEO BACKGROUND VARIANT */}
             {data.variant === 'video' && data.videoUrl ? (
    <div className="absolute inset-0 overflow-hidden pointer-events-none"> {/* pointer-events-none prevents interacting with iframe */}
        {getYoutubeId(data.videoUrl) ? (
    // YOUTUBE EMBED (Optimized "Smart Cover")
    <iframe
        className="absolute top-1/2 left-1/2 w-[177.77vh] min-w-full min-h-[56.25vw] h-[56.25vw] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-80"
        src={`https://www.youtube.com/embed/${getYoutubeId(data.videoUrl)}?controls=0&autoplay=1&mute=1&loop=1&playlist=${getYoutubeId(data.videoUrl)}&playsinline=1&rel=0&iv_load_policy=3&disablekb=1`}
        allow="autoplay; encrypted-media"
        title="Hero Video"
    />
) : (
    // DIRECT MP4 (Library)
    <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute w-full h-full object-cover" // object-cover works perfectly for standard video tags
        poster={data.backgroundImage} 
    >
        <source src={data.videoUrl} type="video/mp4" />
    </video>
)}
                 </div>
             ) : (
             /* B. STATIC IMAGE VARIANT (Default) */
                data.backgroundImage ? (
                    <div className="absolute inset-0 overflow-hidden">
                        <img 
                        src={data.backgroundImage} 
                        alt="Hero Background" 
                        className="w-full h-full object-cover animate-ken-burns scale-100 opacity-90 will-change-transform" 
                        style={{ animationDuration: '20s' }}
                        loading="eager" 
                        decoding="sync"
                        />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-neutral-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 to-neutral-950" />
                )
             )}
             
             {/* Gradient Overlay (Applies to both Video and Image) */}
             <div 
                className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-neutral-950" 
                style={{ opacity: (data.overlayOpacity || 60) / 100 }} 
             />
             
             {/* Cinematic Grain Effect */}
             <div className="hidden md:block absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
       </div>
       
       {/* --- LAYER 2: CONTENT --- */}
       <div className={cn("relative z-10 container mx-auto w-full h-full flex flex-col justify-center px-6 pt-20", alignmentClass)}>
          <div className={cn("space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both", 
             data.alignment === 'center' ? 'max-w-4xl mx-auto' : 'max-w-3xl'
          )}>
              
             {/* Eyebrow Label */}
             <div className="overflow-hidden">
                <span className="inline-block py-1 px-3 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm text-xs md:text-sm font-medium tracking-widest uppercase text-primary animate-fade-up">
                   {data.label || "Welcome"}
                </span>
             </div>

             {/* Headline */}
             <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] md:leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/60 drop-shadow-sm will-change-transform">
                {data.headline}
             </h1>

             {/* Subheadline */}
             <p className="text-lg md:text-2xl text-neutral-300 font-light leading-relaxed max-w-2xl text-shadow-sm">
                {data.subheadline}
             </p>

             {/* CTA Buttons Row */}
             {(data.ctaText || data.secondaryCtaText) && (
                <div className={cn("pt-4 md:pt-8 flex flex-wrap gap-4", 
                    data.alignment === 'center' ? 'justify-center' : 'justify-start'
                )}>
                    
                    {/* Primary Button */}
                    {data.ctaText && (
                        <Button 
                            asChild 
                            size="lg" 
                            className="h-14 md:h-16 px-8 md:px-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-base md:text-lg font-semibold transition-all hover:scale-105 shadow-none md:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] group"
                        >
                        <a href={data.ctaLink || "#contact"}>
                            {data.ctaText} 
                            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                        </a>
                        </Button>
                    )}

                    {/* Secondary Button (Ghost Style) */}
                    {data.secondaryCtaText && (
                        <Button 
                            asChild 
                            size="lg" 
                            variant="outline"
                            className="h-14 md:h-16 px-8 md:px-10 rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm text-base md:text-lg transition-all hover:scale-105"
                        >
                        <a href={data.secondaryCtaLink || "#"}>
                            <Play className="w-4 h-4 mr-2 fill-current" />
                            {data.secondaryCtaText} 
                        </a>
                        </Button>
                    )}
                </div>
             )}
          </div>
       </div>

       {/* --- LAYER 3: SCROLL INDICATOR --- */}
       <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center animate-bounce-slow opacity-70">
           <a href="#content" className="flex flex-col items-center gap-2 text-primary/50 hover:text-primary transition-colors cursor-pointer">
               <span className="text-[10px] uppercase tracking-widest">Scroll</span>
               <ChevronDown className="w-6 h-6" />
           </a>
       </div>

    </section>
  );
};

export default Hero;