// In src/themes/modern/Map.tsx

import React from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from 'lucide-react';
import { cn } from "@/lib/utils";

const Map: React.FC<BlockProps> = ({ data }) => {
  if (!data.mapUrl) return null;
  
  // Helper to ensure valid Embed URL
  let embedSrc = data.mapUrl;
  if (embedSrc.includes('<iframe')) {
      const match = embedSrc.match(/src="([^"]+)"/);
      if (match) embedSrc = match[1];
  }

  // Height Logic
  const heightClass = data.height === 'large' ? 'h-[70vh]' : 'h-[50vh]';

  return (
    <section className={cn("relative w-full bg-neutral-950 overflow-hidden border-t border-white/10", heightClass)}>
        
        {/* --- MAP LAYER --- */}
        <div className="absolute inset-0 w-full h-full">
            <iframe 
                src={embedSrc} 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                // FIX: Added 'will-change-[filter]' to hint the browser
                className="w-full h-full filter grayscale invert-[0.9] contrast-[0.8] brightness-[0.8] opacity-80 hover:opacity-100 transition-opacity duration-700 will-change-[filter]"
            />
        </div>

        {/* --- VIGNETTE OVERLAY --- */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(transparent_0%,_var(--tw-gradient-stops))] from-neutral-950/0 to-neutral-950/100" />

        {/* --- FLOATING INFO CARD --- */}
        <div className="absolute bottom-8 left-4 right-4 md:left-12 md:right-auto md:w-96 z-10">
            {/* FIX 2: 
                - Mobile: Solid background (bg-neutral-900), No Blur. Fast rendering.
                - Desktop: Translucent background, Blur. Premium look.
            */}
            <div className="bg-neutral-900 md:bg-neutral-900/80 backdrop-blur-none md:backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-2xl shadow-lg md:shadow-2xl space-y-4">
                
                {data.title && (
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-full shrink-0">
                            <MapPin className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white leading-none mb-1">{data.title}</h3>
                            <p className="text-xs text-indigo-300 font-mono tracking-wider uppercase">Our HQ</p>
                        </div>
                    </div>
                )}
                
                <p className="text-neutral-400 text-sm leading-relaxed">
                   Visit us at our studio. We are open for appointments Monday through Friday.
                </p>

                <Button 
                    variant="outline" 
                    className="w-full border-white/10 bg-white/5 hover:bg-white hover:text-black text-white transition-all group"
                    asChild
                >
                    <a href={data.mapUrl} target="_blank" rel="noreferrer">
                        <Navigation className="w-4 h-4 mr-2 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /> 
                        Get Directions
                    </a>
                </Button>
            </div>
        </div>

    </section>
  );
};

export default Map;