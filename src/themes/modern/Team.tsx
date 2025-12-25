// In src/themes/modern/Team.tsx

import React from 'react';
import { BlockProps } from '../types';
import { cn } from "@/lib/utils";
import { Linkedin, Twitter, ArrowRight } from 'lucide-react'; 

const Team: React.FC<BlockProps> = ({ data }) => {
  if (!data.members || data.members.length === 0) return null;

  return (
    <section className="relative py-24 md:py-32 px-4 bg-neutral-950 overflow-hidden">
        
        {/* Background Texture & Ambient Lighting */}
        {/* FIX 1: Hide heavy noise on mobile */}
        <div className="hidden md:block absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
        
        {/* FIX 2: Reduce Blur on Mobile */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-indigo-500/10 blur-[80px] md:blur-[150px] rounded-full pointer-events-none" />

        <div className="container max-w-7xl mx-auto relative z-10">
            
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                <span className="text-indigo-400 font-mono text-xs tracking-[0.2em] uppercase">
                    {data.label || "The Collective"}
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    {data.title}
                </h2>
                {data.subtitle && (
                    <p className="text-neutral-400 text-lg font-light">
                        {data.subtitle}
                    </p>
                )}
            </div>

            {/* The Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {data.members.map((member: any, i: number) => (
                    <div 
                        key={i} 
                        className="group relative h-[450px] rounded-2xl overflow-hidden border border-white/5 bg-neutral-900 shadow-lg md:shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-white/20"
                    >
                        
                        {/* --- IMAGE LAYER --- */}
                        <div className="absolute inset-0">
                            {member.image ? (
                                <img 
                                    src={member.image} 
                                    alt={member.name} 
                                    // FIX 3: Lazy loading + GPU Hint for the zoom effect
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover transition-all duration-700 ease-out filter grayscale group-hover:grayscale-0 group-hover:scale-105 will-change-transform" 
                                />
                            ) : (
                                // Fallback gradient if no image
                                <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
                            )}
                            
                            {/* Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                        </div>

                        {/* --- CONTENT LAYER --- */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                            
                            {/* Role (Eyebrow) */}
                            <div className="transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
                                <p className="text-indigo-400 font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                    {member.role}
                                    <span className="w-8 h-px bg-indigo-400/50 hidden group-hover:block transition-all" />
                                </p>
                                
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    {member.name}
                                </h3>
                            </div>

                            {/* Bio / Description (Reveal on Hover) */}
                            <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out">
                                <div className="overflow-hidden">
                                    {member.bio && (
                                        <p className="text-neutral-300 text-sm leading-relaxed mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                                            {member.bio}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Right Accent (Corner decoration) */}
                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white/20 group-hover:bg-indigo-500 transition-colors duration-500" />
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};

export default Team;