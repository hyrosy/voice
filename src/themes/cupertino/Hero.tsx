import React from 'react';
import { cn } from "@/lib/utils";

export const schema = [
  { id: 'alignment', type: 'select', options: ['center', 'left'], label: 'Text Alignment', defaultValue: 'center' },
  { id: 'showGradient', type: 'toggle', label: 'Show Mesh Gradient', defaultValue: true }
];

export const Hero = ({ data, settings = {} }: any) => {
  const align = settings.alignment || 'center';

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-white pt-20">
      
      {/* 1. New Design Element: Subtle Mesh Gradient Blob */}
      {settings.showGradient && (
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] animate-pulse" />
      )}
      {settings.showGradient && (
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[100px]" />
      )}

      <div className={cn("container mx-auto px-6 relative z-10", align === 'center' ? 'text-center' : 'text-left')}>
        
        {/* Eyebrow - Small Capsule */}
        {data.label && (
          <div className={cn("mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700", align === 'center' && 'mx-auto')}>
             <span className="px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                {data.label}
             </span>
          </div>
        )}

        {/* Massive Typography (Inter/SF Pro vibe) */}
        <h1 className="text-6xl md:text-8xl font-[800] tracking-tighter text-slate-900 leading-[0.95] mb-6 animate-in fade-in zoom-in-95 duration-1000">
          {data.headline}
        </h1>

        <p className={cn("text-xl md:text-2xl text-slate-500 max-w-2xl font-medium leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200", align === 'center' && 'mx-auto')}>
          {data.subheadline}
        </p>

        {/* Apple-style Buttons */}
        <div className={cn("flex gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300", align === 'center' && 'justify-center')}>
           {data.ctaText && (
             <button className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold text-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.02] transition-all">
                {data.ctaText}
             </button>
           )}
           {data.secondaryCtaText && (
             <button className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-semibold text-lg hover:bg-slate-50 transition-all">
                {data.secondaryCtaText} &rarr;
             </button>
           )}
        </div>

        {/* Product Image Floating Up */}
        {data.backgroundImage && (
           <div className="mt-20 relative mx-auto max-w-5xl rounded-t-3xl overflow-hidden shadow-2xl border-t border-x border-gray-200 animate-in slide-in-from-bottom-20 duration-1000 delay-500">
              <img src={data.backgroundImage} className="w-full object-cover" />
           </div>
        )}
      </div>
    </section>
  );
};

(Hero as any).schema = schema;