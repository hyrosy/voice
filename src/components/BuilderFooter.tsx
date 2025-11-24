import React from 'react';
import { cn } from "@/lib/utils";
import { Heart, ArrowUp } from 'lucide-react';

const BuilderFooter = () => {
    
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-neutral-950 pt-20 pb-10 overflow-hidden border-t border-white/5">
        
        {/* --- BACKGROUND LAYERS --- */}
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
        
        {/* Top Gradient Line (The "Energy Line") */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />

        {/* Massive Background Watermark */}
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 select-none pointer-events-none whitespace-nowrap">
            <h1 className="text-[12rem] md:text-[20rem] font-black text-white/[0.02] tracking-tighter leading-none">
                UCPMAROC
            </h1>
        </div>

        <div className="container relative z-10 max-w-7xl mx-auto px-6">
            
            {/* Main Footer Content */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                
                {/* Brand / Logo Area */}
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-2">UCPMAROC</h2>
                    <p className="text-neutral-500 text-sm">Operated by HYROSY LLC</p>
                </div>

                {/* Back to Top Button */}
                <button 
                    onClick={scrollToTop}
                    className="group flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all duration-300"
                >
                    <span className="text-sm font-medium">Back to Top</span>
                    <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-1" />
                </button>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-white/10 mb-8" />

            {/* Bottom Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                
                {/* Copyright - Monospace for technical feel */}
                <p className="text-xs text-neutral-600 font-mono uppercase tracking-wider">
                    © {new Date().getFullYear()} All rights reserved.
                </p>

                {/* The "Made With" Tagline */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-white/5 backdrop-blur-sm">
                    <p className="text-sm text-neutral-400 font-medium flex items-center gap-1.5">
                        Made with Allah's Blessings 
                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
                    </p>
                </div>
            </div>
        </div>
    </footer>
  );
};

export default BuilderFooter;