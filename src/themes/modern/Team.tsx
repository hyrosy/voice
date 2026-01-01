import React, { useRef } from 'react';
import { BlockProps } from '../types';
import { cn } from "@/lib/utils";
import { Linkedin, Instagram, ChevronLeft, ChevronRight } from 'lucide-react'; 
import { Button } from "@/components/ui/button";

const Team: React.FC<BlockProps> = ({ data }) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  if (!data.members || data.members.length === 0) return null;

  const variant = data.variant || 'grid'; // grid, spotlight, carousel

  // --- SCROLL LOGIC (For Carousel) ---
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
        const amount = 350; // Scroll amount approx one card width
        carouselRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  // --- SUB-COMPONENT: MEMBER CARD ---
  const MemberCard = ({ member, className, isFeatured = false }: { member: any, className?: string, isFeatured?: boolean }) => (
      <div 
        className={cn(
            "group relative rounded-2xl overflow-hidden border border-white/5 bg-neutral-900 shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-white/20",
            className
        )}
      >
          {/* IMAGE LAYER */}
          <div className="absolute inset-0">
              {member.image ? (
                  <img 
                      src={member.image} 
                      alt={member.name} 
                      loading="lazy"
                      className="w-full h-full object-cover transition-all duration-700 ease-out filter grayscale group-hover:grayscale-0 group-hover:scale-105 will-change-transform" 
                  />
              ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />
          </div>

          {/* CONTENT LAYER */}
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
              
              <div className="transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
                  <p className="text-primary font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                      {member.role}
                      <span className="w-8 h-px bg-primary/50 hidden group-hover:block transition-all" />
                  </p>
                  
                  <h3 className={cn("font-bold text-white mb-2 leading-tight", isFeatured ? "text-3xl md:text-4xl" : "text-xl md:text-2xl")}>
                      {member.name}
                  </h3>
              </div>

              {/* Bio & Socials (Reveal on Hover) */}
              <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out">
                  <div className="overflow-hidden">
                      {member.bio && (
                          <p className={cn("text-neutral-300 leading-relaxed mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100", isFeatured ? "text-base max-w-lg" : "text-sm")}>
                              {member.bio}
                          </p>
                      )}
                      
                      {/* Social Icons */}
                      <div className="flex gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-200">
                          {member.linkedin && (
                              <a href={member.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-primary hover:text-black transition-colors">
                                  <Linkedin className="w-4 h-4" />
                              </a>
                          )}
                          {member.instagram && (
                              <a href={member.instagram} target="_blank" rel="noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-primary hover:text-black transition-colors">
                                  <Instagram className="w-4 h-4" />
                              </a>
                          )}
                      </div>
                  </div>
              </div>
          </div>

          {/* Top Right Accent */}
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white/20 group-hover:bg-primary transition-colors duration-500" />
      </div>
  );

  return (
    <section className="relative py-24 md:py-32 px-4 bg-neutral-950 overflow-hidden">
        
        {/* Background Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="container max-w-7xl mx-auto relative z-10">
            
            {/* Header */}
            {data.title && (
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <span className="text-primary font-mono text-xs tracking-[0.2em] uppercase block">
                        {data.label || "The Team"}
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        {data.title}
                    </h2>
                </div>
            )}

            {/* === VARIANT 1: GRID (Classic) === */}
            {variant === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {data.members.map((member: any, i: number) => (
                        <MemberCard key={i} member={member} className="h-[450px]" />
                    ))}
                </div>
            )}

            {/* === VARIANT 2: SPOTLIGHT (Founder First) === */}
            {variant === 'spotlight' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* First Member = Big Feature */}
                    <div className="lg:col-span-2">
                        <MemberCard member={data.members[0]} className="h-[500px] lg:h-[600px]" isFeatured={true} />
                    </div>
                    {/* Rest of the team */}
                    <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                        {data.members.slice(1, 3).map((member: any, i: number) => (
                            <MemberCard key={i} member={member} className="h-[400px] lg:h-[288px]" />
                        ))}
                    </div>
                    {/* Remaining members */}
                    {data.members.length > 3 && (
                        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
                             {data.members.slice(3).map((member: any, i: number) => (
                                <MemberCard key={i} member={member} className="h-[400px]" />
                             ))}
                        </div>
                    )}
                </div>
            )}

            {/* === VARIANT 3: CAROUSEL (Scroll with Arrows) === */}
            {variant === 'carousel' && (
                <div className="relative group/carousel">
                    
                    {/* LEFT ARROW (Desktop Only) */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white h-12 w-12 hidden md:flex hover:bg-black/70 rounded-full border border-white/10 backdrop-blur-sm -ml-4 lg:-ml-12 opacity-0 group-hover/carousel:opacity-100 transition-opacity" 
                        onClick={() => scrollCarousel('left')}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>

                    {/* RIGHT ARROW (Desktop Only) */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white h-12 w-12 hidden md:flex hover:bg-black/70 rounded-full border border-white/10 backdrop-blur-sm -mr-4 lg:-mr-12 opacity-0 group-hover/carousel:opacity-100 transition-opacity" 
                        onClick={() => scrollCarousel('right')}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </Button>

                    {/* SCROLL CONTAINER */}
                    {/* Added: [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] */}
                    <div 
                        ref={carouselRef}
                        className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                    >
                        {data.members.map((member: any, i: number) => (
                            <div key={i} className="snap-center shrink-0 w-[85vw] sm:w-[350px]">
                                <MemberCard member={member} className="h-[500px]" />
                            </div>
                        ))}
                    </div>

                    {/* Fade Edges (Desktop Only) */}
                    <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-neutral-950 to-transparent pointer-events-none md:block hidden z-10" />
                </div>
            )}

        </div>
    </section>
  );
};

export default Team;