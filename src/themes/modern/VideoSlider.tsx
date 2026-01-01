import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom'; // <--- NEW IMPORT
import { BlockProps } from '../types';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

const VideoSlider: React.FC<BlockProps> = ({ data }) => {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  // Track if component is mounted to safely use document/portals
  const [mounted, setMounted] = useState(false);
  
  const carouselRef = useRef<HTMLDivElement>(null);

  const videos = data.videos || [];
  const variant = data.variant || 'cinema'; // cinema, carousel, grid

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- SCROLL LOCK ---
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  // --- YOUTUBE HELPERS ---
  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getThumbnail = (url: string) => {
     const ytId = getYoutubeId(url);
     if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
     return null;
  };

  // --- NAVIGATION ---
  const nextSlide = () => setCurrent((prev) => (prev + 1) % videos.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + videos.length) % videos.length);
  
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
        const amount = 350;
        carouselRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  // --- LIGHTBOX ---
  const openLightbox = (index: number) => {
      setLightboxIndex(index);
      setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);


  // --- SUB-COMPONENT: VIDEO CARD ---
  const VideoCard = ({ video, index, className }: { video: any, index: number, className?: string }) => {
      const isYoutube = !!getYoutubeId(video.url);
      const thumb = getThumbnail(video.url);

      return (
          <div 
            className={cn(
                "group relative rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shadow-lg cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-2xl", 
                className
            )}
            onClick={() => openLightbox(index)}
          >
              <div className="relative w-full h-full aspect-video bg-black">
                  {isYoutube ? (
                      <img src={thumb || ''} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt={video.title} />
                  ) : (
                      <video 
                        src={video.url} 
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" 
                        muted 
                        playsInline
                        onContextMenu={(e) => e.preventDefault()}
                      />
                  )}
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all shadow-lg">
                          <Play className="w-5 h-5 text-white fill-white ml-1" />
                      </div>
                  </div>
              </div>

              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                  <h4 className="text-white font-medium text-sm truncate">{video.title || "Untitled Video"}</h4>
                  {video.caption && <p className="text-white/60 text-xs truncate">{video.caption}</p>}
              </div>
          </div>
      );
  };

  if (videos.length === 0) return null;

  return (
    <section className="py-20 bg-neutral-950 text-white relative overflow-hidden">
       {/* Texture */}
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>

       <div className="container px-4 mx-auto relative z-10">
          
          {data.title && (
            <div className="mb-10 text-center space-y-2">
                <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Watch</span>
                <h2 className="text-3xl md:text-5xl font-bold">{data.title}</h2>
            </div>
          )}

          {/* === VARIANT 1: CINEMA SPOTLIGHT === */}
          {variant === 'cinema' && (
              <div className="max-w-5xl mx-auto">
                  <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                      {(() => {
                          const vid = videos[current];
                          const ytId = getYoutubeId(vid.url);
                          return ytId ? (
                              <iframe 
                                src={`https://www.youtube.com/embed/${ytId}?rel=0`} 
                                className="w-full h-full" 
                                allowFullScreen 
                                title={vid.title}
                              />
                          ) : (
                              <video 
                                src={vid.url} 
                                className="w-full h-full" 
                                controls 
                                controlsList="nodownload" 
                                onContextMenu={(e) => e.preventDefault()}
                              />
                          );
                      })()}
                  </div>
                  <div className="flex items-center justify-between mt-6">
                      <div className="space-y-1">
                          <h3 className="text-2xl font-bold">{videos[current].title}</h3>
                          <p className="text-neutral-400">{videos[current].caption}</p>
                      </div>
                      <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={prevSlide} className="rounded-full border-white/10 hover:bg-white/10 text-white"><ChevronLeft/></Button>
                          <Button variant="outline" size="icon" onClick={nextSlide} className="rounded-full border-white/10 hover:bg-white/10 text-white"><ChevronRight/></Button>
                      </div>
                  </div>
              </div>
          )}

          {/* === VARIANT 2: CAROUSEL (Netflix Strip) === */}
          {variant === 'carousel' && (
              <div className="relative group/carousel">
                  <Button variant="ghost" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 text-white h-12 w-12 hidden md:flex hover:bg-black/80 rounded-r-xl rounded-l-none border-y border-r border-white/10" onClick={() => scrollCarousel('left')}><ChevronLeft /></Button>
                  <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 text-white h-12 w-12 hidden md:flex hover:bg-black/80 rounded-l-xl rounded-r-none border-y border-l border-white/10" onClick={() => scrollCarousel('right')}><ChevronRight /></Button>

                  <div ref={carouselRef} className="flex overflow-x-auto gap-4 pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 flex-nowrap">
                      {videos.map((vid: any, idx: number) => (
                          <div key={idx} className="snap-center shrink-0 w-[85vw] sm:w-[350px]">
                              <VideoCard video={vid} index={idx} className="w-full h-full" />
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* === VARIANT 3: GRID (Video Wall) === */}
          {variant === 'grid' && (
              <div className={cn("grid gap-6", 
                  data.gridColumns === 2 ? "sm:grid-cols-2" : 
                  data.gridColumns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : 
                  "sm:grid-cols-2 lg:grid-cols-3"
              )}>
                  {videos.map((vid: any, idx: number) => (
                      <div key={idx} className="aspect-video">
                          <VideoCard video={vid} index={idx} className="w-full h-full" />
                      </div>
                  ))}
              </div>
          )}

       </div>

       {/* --- LIGHTBOX (PORTAL FIX) --- */}
       {mounted && lightboxOpen && createPortal(
           <div 
             className="fixed inset-0 z-[9999] w-screen h-screen bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10" 
             onClick={closeLightbox}
           >
               {/* Close Button */}
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="absolute top-4 right-4 text-white/70 hover:text-white z-50 hover:bg-white/10 rounded-full h-12 w-12" 
                 onClick={closeLightbox}
               >
                 <X className="w-8 h-8" />
               </Button>

               {/* Video Container - Centered and Responsive */}
               <div 
                 className="w-full max-w-6xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative ring-1 ring-white/10 animate-in zoom-in-95 duration-200"
                 onClick={e => e.stopPropagation()} 
               >
                   {(() => {
                        const vid = videos[lightboxIndex];
                        const ytId = getYoutubeId(vid.url);
                        return ytId ? (
                            <iframe 
                              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`} 
                              className="w-full h-full" 
                              allowFullScreen 
                              allow="autoplay" 
                            />
                        ) : (
                            <video 
                              src={vid.url} 
                              className="w-full h-full" 
                              controls 
                              autoPlay 
                              controlsList="nodownload" 
                              onContextMenu={(e) => e.preventDefault()}
                            />
                        );
                   })()}
               </div>
           </div>,
           document.body // Renders lightbox directly into the <body>
       )}
    </section>
  );
};

export default VideoSlider;