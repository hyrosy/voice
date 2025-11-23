// In src/themes/cinematic/ImageSlider.tsx

import React from 'react';
import { BlockProps } from '../types';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/autoplay';
import { EffectFade, Autoplay } from 'swiper/modules';

const ImageSlider: React.FC<BlockProps> = ({ data }) => {
  if (!data.images || data.images.length === 0) return null;

  return (
    <section className="relative h-screen w-full bg-black">
        <Swiper
          spaceBetween={0}
          effect={'fade'}
          centeredSlides={true}
          autoplay={{
            delay: (data.interval || 5) * 1000,
            disableOnInteraction: false,
          }}
          modules={[EffectFade, Autoplay]}
          className="h-full w-full"
        >
          {data.images.map((img: any, index: number) => (
            <SwiperSlide key={index}>
               <div className="relative w-full h-full">
                  {/* Image with slow zoom effect via CSS */}
                  <img 
                      src={img.url} 
                      alt={img.caption} 
                      className="w-full h-full object-cover animate-subtle-zoom" // You'd add this keyframe
                  />
                  {/* Cinematic Dark Overlay */}
                  <div className="absolute inset-0 bg-black/40" />
                  
                  {/* Caption - Centered & Epic */}
                  {img.caption && (
                      <div className="absolute inset-0 flex items-center justify-center">
                          <h3 className="text-4xl md:text-7xl font-black text-white text-center uppercase tracking-widest drop-shadow-2xl opacity-90 px-4">
                              {img.caption}
                          </h3>
                      </div>
                  )}
               </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Floating Title */}
        {data.title && (
             <div className="absolute top-8 left-8 z-10">
                 <span className="text-xs font-bold tracking-[0.3em] text-red-500 uppercase border border-red-500 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md">
                     {data.title}
                 </span>
             </div>
        )}
    </section>
  );
};

export default ImageSlider;