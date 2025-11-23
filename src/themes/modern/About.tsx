// In src/themes/modern/About.tsx

import React from 'react';
import { BlockProps } from '../types';
import { cn } from "@/lib/utils";
import { CheckCircle2, ArrowRight } from 'lucide-react'; // Ensure lucide-react is installed

const About: React.FC<BlockProps> = ({ data }) => {
  const isStacked = data.layout === 'stacked';
  const isLeft = data.layout === 'split-left';

  // Use data.stats if available, or fallback to empty array
  const stats = data.stats || [];
  // Use data.features if available
  const features = data.features || [];

  return (
    <section className="relative py-24 md:py-32 px-6 bg-neutral-950 overflow-hidden">
        
        {/* --- Background Texture & Lighting --- */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className={cn("relative container mx-auto z-10", isStacked ? "max-w-4xl text-center" : "max-w-7xl")}>
          <div className={cn("grid gap-16 lg:gap-24 items-center", isStacked ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
            
            {/* --- Image Section --- */}
            {data.image && (
                <div className={cn("relative group", isLeft ? "lg:order-first" : "lg:order-last", isStacked ? "mx-auto" : "")}>
                   
                   {/* Decorative Elements behind image */}
                   <div className={cn(
                       "absolute inset-0 bg-white/5 rounded-3xl transform translate-x-4 translate-y-4 transition-transform duration-500 group-hover:translate-x-6 group-hover:translate-y-6",
                       isStacked ? "rounded-full scale-110" : ""
                   )} />
                   
                   <div className={cn(
                       "relative overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl",
                       isStacked ? "w-64 h-64 md:w-80 md:h-80 rounded-full mx-auto ring-1 ring-white/20 ring-offset-4 ring-offset-black" : "rounded-3xl aspect-[4/5] md:aspect-square lg:aspect-[4/5]"
                   )}>
                      <img 
                          src={data.image} 
                          alt="About" 
                          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105 filter grayscale-[20%] group-hover:grayscale-0" 
                      />
                      
                      {/* Optional Overlay on Image */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                   </div>
                </div>
            )}
            
            {/* --- Text Section --- */}
            <div className={cn("space-y-8", isStacked ? "flex flex-col items-center" : "")}>
                
                <div className="space-y-4">
                    <span className="text-indigo-400 font-mono text-sm tracking-widest uppercase flex items-center gap-2">
                        {isStacked ? null : <span className="w-8 h-px bg-indigo-400"></span>}
                        {data.label || "Who We Are"} {/* Uses dynamic label */}
                    </span>

                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
                        {data.title}
                    </h2>
                </div>

                <div className={cn("h-1 bg-gradient-to-r from-indigo-500 to-transparent", isStacked ? "w-24 mx-auto" : "w-24")} />
                
                <p className="text-lg md:text-xl text-neutral-400 leading-relaxed font-light whitespace-pre-wrap">
                    {data.content}
                </p>

                {/* --- DYNAMIC FEATURES LIST --- */}
                {features.length > 0 && (
                    <div className={cn("grid gap-4 pt-4", isStacked ? "grid-cols-1 md:grid-cols-2 text-left" : "grid-cols-1 sm:grid-cols-2")}>
                        {features.map((feature: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-white/40 mt-1 shrink-0" />
                                <p className="text-neutral-300">{feature}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- DYNAMIC STATS ROW --- */}
                {data.showStats !== false && stats.length > 0 && (
                    <div className="pt-8 border-t border-white/10 w-full">
                        <div className="grid grid-cols-3 gap-8">
                            {stats.map((stat: any, idx: number) => (
                                <div key={idx} className="space-y-1">
                                    <h4 className="text-2xl md:text-3xl font-bold text-white">{stat.value}</h4>
                                    <p className="text-xs md:text-sm text-neutral-500 uppercase tracking-wider">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
    </section>
  );
};

export default About;