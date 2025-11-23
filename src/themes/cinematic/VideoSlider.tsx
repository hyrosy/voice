import React from 'react';
import { BlockProps } from '../types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// --- THE FIX FOR REACT PLAYER ---
import ReactPlayerOriginal from 'react-player';
const ReactPlayer = ReactPlayerOriginal as any;
// --------------------------------

const VideoSlider: React.FC<BlockProps> = ({ data }) => {
  if (!data.videos || data.videos.length === 0) return null;

  return (
    <section className="relative bg-zinc-950 py-32 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-red-900/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Title */}
        {data.title && (
            <div className="container mx-auto mb-16 text-center z-10 relative">
                 <h2 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 tracking-tighter uppercase">
                    {data.title}
                 </h2>
                 <div className="h-1 w-24 bg-red-600 mx-auto mt-6 rounded-full" />
            </div>
        )}

        <Swiper
          effect={'coverflow'}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          initialSlide={1}
          coverflowEffect={{
            rotate: 35,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
          }}
          pagination={{ clickable: true }}
          navigation={true}
          modules={[EffectCoverflow, Pagination, Navigation]}
          className="w-full py-10"
          style={{
              '--swiper-pagination-color': '#dc2626', // Tailwind red-600
              '--swiper-navigation-color': '#ffffff',
          } as React.CSSProperties}
        >
          {data.videos.map((vid: any, index: number) => (
            // Width is fixed to create the "card" look in the 3D space
            <SwiperSlide key={index} className="w-[300px] sm:w-[500px] md:w-[700px] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5">
               <div className="w-full h-full relative group">
                  <ReactPlayer
                      url={vid.url || ''}
                      width="100%"
                      height="100%"
                      controls={true}
                      light={vid.poster || true} // Thumbnail
                      playIcon={
                        <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-red-600/40">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8 ml-1"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      }
                      config={{
                          file: { attributes: { controlsList: 'nodownload' } }
                      }}
                  />
                  
                  {/* Video Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
                      <h3 className="text-white font-bold text-xl tracking-wide">{vid.title}</h3>
                  </div>
               </div>
            </SwiperSlide>
          ))}
        </Swiper>
    </section>
  );
};

export default VideoSlider;