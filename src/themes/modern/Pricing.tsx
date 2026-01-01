import React, { useRef } from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ChevronRight, ChevronLeft, ExternalLink } from 'lucide-react';
import { cn } from "@/lib/utils";

const Pricing: React.FC<BlockProps> = ({ data }) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  if (!data.plans || data.plans.length === 0) return null;
  const variant = data.variant || 'cards'; // cards, slider, list

  // --- SCROLL LOGIC ---
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
        const amount = 350; // Approx card width
        carouselRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  // --- COMPONENT: CARD (Grid & Slider) ---
  const PricingCard = ({ plan }: { plan: any }) => {
    const isPopular = plan.isPopular;
    const isExternal = plan.buttonUrl?.startsWith('http');
    const linkTarget = isExternal ? "_blank" : "_self";

    return (
        <div className={cn(
            "relative group h-full flex flex-col p-8 rounded-[2rem] transition-all duration-500 border",
            isPopular 
                ? "bg-neutral-900/90 border-primary/50 shadow-2xl scale-[1.02] z-10" 
                : "bg-neutral-900/40 border-white/10 hover:border-white/20 hover:bg-neutral-900/60"
        )}>
            {/* Glow for Popular */}
            {isPopular && (
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none rounded-[2rem]" />
            )}

            {/* Badge */}
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 whitespace-nowrap z-20">
                    <Sparkles className="w-3 h-3 fill-black" /> Popular
                </div>
            )}

            {/* Header */}
            <div className="mb-8 text-center relative z-10">
                <h3 className="text-sm font-mono text-primary uppercase tracking-widest mb-4">
                    {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        {plan.price}
                    </span>
                    {plan.unit && (
                        <span className="text-lg text-neutral-400 font-medium">
                             {plan.unit.startsWith('/') ? plan.unit : `/${plan.unit}`}
                        </span>
                    )}
                </div>
            </div>

            {/* Features Divider */}
            <div className={cn("h-px w-full mb-8", isPopular ? "bg-primary/30" : "bg-white/10")} />
            
            {/* Features List */}
            <ul className="space-y-4 flex-grow relative z-10 mb-8">
                {plan.features?.split(',').map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-300">
                        <div className={cn(
                            "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0", 
                            isPopular ? "bg-primary text-black" : "bg-white/10 text-white"
                        )}>
                            <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="opacity-90">{feat.trim()}</span>
                    </li>
                ))}
            </ul>

            {/* Button */}
            <div className="relative z-10 mt-auto">
                <Button 
                    asChild
                    className={cn(
                        "w-full h-12 rounded-xl text-base font-semibold transition-all duration-300",
                        isPopular 
                            ? "bg-primary hover:bg-primary/80 text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                            : "bg-white text-black hover:bg-neutral-200"
                    )}
                >
                    <a href={plan.buttonUrl || "#contact"} target={linkTarget} rel={isExternal ? "noopener noreferrer" : undefined}>
                        {plan.cta || "Get Started"}
                        {isExternal && <ExternalLink className="ml-2 w-3 h-3 opacity-50" />}
                    </a>
                </Button>
            </div>
        </div>
    );
  };

  // --- COMPONENT: RATE CARD ITEM ---
  const RateCardItem = ({ plan }: { plan: any }) => {
      const isExternal = plan.buttonUrl?.startsWith('http');
      const linkTarget = isExternal ? "_blank" : "_self";

      return (
          <div className="group relative border-b border-white/10 last:border-0 py-6">
              
              {/* Row 1: Name ...... Price */}
              <div className="flex items-end justify-between w-full mb-3">
                  <div className="flex items-end flex-grow min-w-0">
                      <h3 className="text-xl md:text-2xl font-bold text-white shrink-0 pr-4 bg-transparent">
                          {plan.name}
                      </h3>
                      {/* Dotted Leader */}
                      <div className="flex-grow border-b-2 border-dotted border-white/20 relative -top-1.5 opacity-40 hidden md:block mx-2" />
                  </div>
                  
                  <div className="text-xl md:text-2xl font-mono text-primary font-medium shrink-0 pl-4">
                      {plan.price}
                      {plan.unit && <span className="text-sm text-neutral-500 ml-1 font-sans">{plan.unit}</span>}
                  </div>
              </div>

              {/* Row 2: Description + Action Button */}
              <div className="flex justify-between items-end gap-6">
                  <p className="text-neutral-400 text-sm leading-relaxed max-w-xl">
                      {plan.features}
                  </p>
                  
                  {/* Always Visible Minimal Button */}
                  <Button 
                    asChild 
                    size="sm" 
                    variant="outline" 
                    className="shrink-0 rounded-full border-white/20 text-neutral-300 hover:text-white hover:border-primary hover:bg-primary/10 transition-all"
                  >
                      <a href={plan.buttonUrl || "#contact"} target={linkTarget} rel={isExternal ? "noopener noreferrer" : undefined} className="flex items-center gap-2">
                          <span className="hidden sm:inline text-xs uppercase tracking-wider font-semibold">{plan.cta || "Book"}</span>
                          <ChevronRight className="w-4 h-4" />
                      </a>
                  </Button>
              </div>
          </div>
      );
  };

  return (
    <section className="relative py-24 md:py-32 bg-neutral-950 overflow-hidden" id="pricing">
        
        {/* Background Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="container max-w-7xl mx-auto relative z-10 px-4">
            
            {/* Header */}
            {data.title && (
                <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20 space-y-4">
                    <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                        {data.title}
                    </h2>
                    <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
                </div>
            )}
            
            {/* === VARIANT 1: GRID CARDS === */}
            {variant === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start p-4 md:p-8">
                    {data.plans.map((plan: any, i: number) => (
                        <PricingCard key={i} plan={plan} />
                    ))}
                </div>
            )}

            {/* === VARIANT 2: SLIDER (Carousel) === */}
            {variant === 'slider' && (
                <div className="relative group/carousel">
                    
                    {/* Left Arrow (Desktop Only) */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white h-12 w-12 hidden md:flex hover:bg-black/70 rounded-full border border-white/10 backdrop-blur-sm -ml-4 lg:-ml-12 opacity-0 group-hover/carousel:opacity-100 transition-opacity" 
                        onClick={() => scrollCarousel('left')}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>

                    {/* Right Arrow (Desktop Only) */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white h-12 w-12 hidden md:flex hover:bg-black/70 rounded-full border border-white/10 backdrop-blur-sm -mr-4 lg:-mr-12 opacity-0 group-hover/carousel:opacity-100 transition-opacity" 
                        onClick={() => scrollCarousel('right')}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </Button>

                    {/* Scroll Container */}
                    <div 
                        ref={carouselRef}
                        className="flex overflow-x-auto py-10 -mx-4 px-8 gap-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                    >
                         {data.plans.map((plan: any, i: number) => (
                            <div key={i} className="snap-center shrink-0 w-[85vw] sm:w-[350px] h-full">
                                <PricingCard plan={plan} />
                            </div>
                         ))}
                    </div>
                </div>
            )}

            {/* === VARIANT 3: RATE CARD (List) === */}
            {variant === 'list' && (
                <div className="max-w-4xl mx-auto bg-neutral-900/30 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                    <div className="space-y-2">
                        {data.plans.map((plan: any, i: number) => (
                            <RateCardItem key={i} plan={plan} />
                        ))}
                    </div>
                    
                    <div className="mt-12 text-center pt-6 border-t border-white/5">
                        <Button asChild size="lg" className="rounded-full px-10 h-14 bg-white text-black hover:bg-neutral-200 shadow-xl transition-transform hover:scale-105">
                            <a href="#contact">Contact for Custom Rates</a>
                        </Button>
                    </div>
                </div>
            )}

        </div>
    </section>
  );
};

export default Pricing;