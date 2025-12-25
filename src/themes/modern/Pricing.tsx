// In src/themes/modern/Pricing.tsx

import React from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// --- THE CARD COMPONENT ---
const PricingCard = ({ plan, index }: { plan: any, index: number }) => {
    const isPopular = plan.isPopular || plan.name?.toLowerCase().includes('pro') || plan.name?.toLowerCase().includes('popular');

    return (
        <div className={cn(
            "relative group h-full flex flex-col p-8 rounded-[2rem] transition-all duration-500 border",
            isPopular 
                // FIX 3: Simplified mobile shadow. No scale on mobile to prevent layout shift issues.
                ? "bg-neutral-900/80 border-indigo-500/50 shadow-lg md:shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)] md:scale-[1.02] z-10" 
                : "bg-neutral-900/40 border-white/10 hover:border-white/20 hover:bg-neutral-900/60"
        )}>
            
            {/* Ambient Inner Glow for Popular Plans */}
            {isPopular && (
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none rounded-[2rem]" />
            )}

            {/* Popular Badge */}
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2">
                    <Sparkles className="w-3 h-3 fill-white" /> Most Popular
                </div>
            )}

            {/* Header */}
            <div className="mb-8 text-center relative z-10">
                <h3 className="text-sm font-mono text-indigo-300 uppercase tracking-widest mb-4">
                    {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                        {plan.price}
                    </span>
                    {!plan.price.includes('$') && ( 
                         <span className="text-neutral-500 text-lg">/project</span>
                    )}
                </div>
                {plan.description && (
                    <p className="text-neutral-400 mt-4 text-sm font-light">
                        {plan.description}
                    </p>
                )}
            </div>

            {/* Features Divider */}
            <div className={cn("h-px w-full mb-8", isPopular ? "bg-indigo-500/30" : "bg-white/10")} />

            {/* Features List */}
            <ul className="space-y-4 flex-grow relative z-10 mb-8">
                {plan.features?.split(',').map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm md:text-base text-neutral-300">
                        <div className={cn(
                            "mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0", 
                            isPopular ? "bg-indigo-500 text-white" : "bg-white/10 text-white"
                        )}>
                            <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="opacity-90">{feat.trim()}</span>
                    </li>
                ))}
            </ul>

            {/* CTA Button */}
            <div className="relative z-10 mt-auto">
                <Button 
                    className={cn(
                        "w-full h-14 rounded-xl text-lg font-semibold transition-all duration-300 shadow-none md:shadow-lg",
                        isPopular 
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white md:shadow-indigo-500/25" 
                            : "bg-white text-black hover:bg-neutral-200"
                    )}
                >
                    {plan.cta || "Get Started"}
                </Button>
            </div>
        </div>
    );
};

const Pricing: React.FC<BlockProps> = ({ data }) => {
  if (!data.plans || data.plans.length === 0) return null;

  return (
    <section className="relative py-24 md:py-32 px-4 bg-neutral-950 overflow-hidden">
        
        {/* Background Texture & Lighting */}
        {/* FIX 1: Hide Noise on Mobile */}
        <div className="hidden md:block absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
        
        {/* FIX 2: Reduce Blur Radius on Mobile */}
        <div className="absolute bottom-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-500/10 blur-[60px] md:blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-500/10 blur-[60px] md:blur-[120px] rounded-full pointer-events-none" />

        <div className="container max-w-7xl mx-auto relative z-10">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-4">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                    {data.title}
                </h2>
                <p className="text-lg md:text-xl text-neutral-400 font-light leading-relaxed">
                    Transparent pricing for every stage of your project.
                </p>
            </div>
            
            {/* Layout Logic */}
            {data.layout === 'slider' ? (
                <div className="px-0 md:px-12">
                    <Carousel 
                        opts={{ align: "start", loop: false }} 
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4 pb-12">
                            {data.plans.map((plan: any, i: number) => (
                                <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3 pl-4 h-auto">
                                    <PricingCard plan={plan} index={i} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="hidden md:block">
                             <CarouselPrevious className="bg-neutral-800 border-white/10 text-white hover:bg-white hover:text-black" />
                             <CarouselNext className="bg-neutral-800 border-white/10 text-white hover:bg-white hover:text-black" />
                        </div>
                    </Carousel>
                </div>
            ) : (
                /* Grid Layout */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                    {data.plans.map((plan: any, i: number) => (
                        <PricingCard key={i} plan={plan} index={i} />
                    ))}
                </div>
            )}
        </div>
    </section>
  );
};

export default Pricing;