// In src/themes/modern/Gallery.tsx

import React from 'react';
import { BlockProps } from '../types';
import { cn } from "@/lib/utils";
import { Plus, Maximize2 } from 'lucide-react'; // Ensure lucide-react is installed

const Gallery: React.FC<BlockProps> = ({ data }) => {
    if (!data.images || data.images.length === 0) return null;

    // --- CONFIGURATION ---
    // Column logic: We use CSS columns for true Masonry (pintrest style) layout
    const columnsClass = data.gridColumns === 2 ? 'sm:columns-2' : 
                         data.gridColumns === 4 ? 'sm:columns-2 md:columns-3 lg:columns-4' : 
                         'sm:columns-2 md:columns-3'; // Default 3

    // Gap logic: In CSS columns, we handle vertical gap via margin-bottom on the item
    const mbClass = data.gap === 'none' ? 'mb-0' : 
                    data.gap === 'large' ? 'mb-8' : 
                    'mb-4'; 
    
    // We also use a wrapper padding to create the horizontal gap visual
    const horizontalGapClass = data.gap === 'none' ? 'p-0' : 
                               data.gap === 'large' ? 'p-4' : 
                               'p-2';

    return (
        <section className="relative py-24 md:py-32 bg-neutral-950 overflow-hidden">
            
            {/* Background Texture & Ambient Glow */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative container max-w-7xl mx-auto px-4 z-10">
                
                {/* --- HEADER SECTION --- */}
                <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24 space-y-4">
                    <span className="text-indigo-400 font-mono text-xs tracking-[0.2em] uppercase">
                        {data.label || "Gallery"}
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                        {data.title || "Selected Works"}
                    </h2>
                    {data.description && (
                         <p className="text-neutral-400 text-lg font-light leading-relaxed">
                             {data.description}
                         </p>
                    )}
                </div>

                {/* --- MASONRY GRID --- */}
                {/* 'column-count' CSS property creates the masonry effect */}
                <div className={cn("w-full transition-all duration-500", columnsClass)}>
                    {data.images.map((img: any, i: number) => (
                        <div 
                            key={i} 
                            className={cn("break-inside-avoid relative group", mbClass, horizontalGapClass)}
                        >
                            <div className="relative overflow-hidden rounded-xl bg-neutral-900 shadow-2xl border border-white/5">
                                
                                {/* The Image */}
                                <img 
                                    src={img.url} 
                                    alt={img.alt || `Gallery Item ${i}`} 
                                    decoding="async" // <--- ADD THIS    
                                    className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-110 will-change-transform" 
                                    loading="lazy"
                                />

                                {/* Overlay: Gradient scrim that appears on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Hover Content: Icon and Text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                                    
                                    {/* Action Button Visual */}
                                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3">
                                        <Maximize2 className="w-5 h-5 text-white" />
                                    </div>

                                    {/* Caption (if available) */}
                                    {img.caption && (
                                        <p className="text-white font-medium text-sm tracking-wide px-4 text-center">
                                            {img.caption}
                                        </p>
                                    )}
                                </div>

                                {/* Shine Effect on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:animate-shine pointer-events-none" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Gallery;