import React, { useState, useEffect, useRef } from "react";
import { BlockProps } from "../types";
import { cn } from "@/lib/utils";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Play,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
// 🚀 1. IMPORT INLINE EDIT
import { InlineEdit } from "../../components/dashboard/InlineEdit";

// 🚀 2. GRAB id AND isPreview FROM PROPS
const Gallery: React.FC<any> = ({ data, id, isPreview }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ref for the carousel container to control scrolling
  const carouselRef = useRef<HTMLDivElement>(null);

  const images = data.images || [];
  const hasImages = images.length > 0;
  const variant = data.variant || "masonry";

  // 🚀 3. HIDE ON LIVE SITE IF EMPTY, BUT SHOW IN PREVIEW
  if (!hasImages && !isPreview) return null;

  // Aspect Ratio classes for Grid Mode
  const aspectClass =
    data.aspectRatio === "portrait"
      ? "aspect-[2/3]"
      : data.aspectRatio === "landscape"
      ? "aspect-video"
      : "aspect-square";

  const gridColsClass =
    data.gridColumns === 2
      ? "md:grid-cols-2"
      : data.gridColumns === 4
      ? "md:grid-cols-4"
      : "md:grid-cols-3";

  // --- SCROLL BUTTON LOGIC ---
  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 400; // Pixel amount to scroll
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // --- LIGHTBOX LOGIC ---
  const openLightbox = (index: number) => {
    // 🚀 4. DO NOT OPEN LIGHTBOX IN BUILDER (Prevents trapping the user)
    if (isPreview) return;

    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "auto";
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  const isVideo = (url: string) => url.match(/\.(mp4|webm|mov)$/i);

  // --- SUB-COMPONENT: GALLERY ITEM ---
  const GalleryItem = ({
    img,
    index,
    className,
    imageClass,
  }: {
    img: any;
    index: number;
    className?: string;
    imageClass?: string;
  }) => (
    <div
      className={cn(
        "group relative overflow-hidden bg-neutral-900 mb-4 break-inside-avoid",
        "rounded-xl border border-white/5 shadow-md transition-all duration-500 hover:shadow-xl hover:border-white/20",
        isPreview ? "cursor-default" : "cursor-zoom-in", // 🚀 Adjust cursor if preview mode
        className
      )}
      onClick={() => openLightbox(index)}
    >
      {isVideo(img.url) ? (
        <div className="relative w-full h-full">
          <video
            src={img.url}
            className={cn(
              "w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity",
              imageClass
            )}
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        </div>
      ) : (
        <img
          src={img.url}
          alt="Gallery"
          loading="lazy"
          className={cn(
            "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0",
            imageClass
          )}
        />
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
        <Maximize2 className="w-6 h-6 text-white opacity-80" />
      </div>
    </div>
  );

  return (
    <section className="py-24 bg-neutral-950 text-white relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

      <div className="container px-4 mx-auto relative z-10">
        {/* 🚀 5. ALWAYS RENDER HEADER FOR INLINE EDITING */}
        <div className="mb-12 text-center space-y-4">
          <InlineEdit
            tagName="h2"
            className="text-3xl md:text-5xl font-bold tracking-tight block"
            text={data.title || "Gallery"}
            sectionId={id}
            fieldKey="title"
            isPreview={isPreview}
          />
          <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
        </div>

        {/* 🚀 6. EMPTY STATE UX FOR BUILDER */}
        {!hasImages && isPreview && (
          <div className="w-full py-20 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center text-white/50">
            <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
            <p>
              No images added yet. Hover over this section and click "Edit
              Gallery" to upload media.
            </p>
          </div>
        )}

        {hasImages && (
          <>
            {/* --- VARIANT 1: MASONRY --- */}
            {variant === "masonry" && (
              <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
                {images.map((img: any, idx: number) => (
                  <GalleryItem
                    key={idx}
                    img={img}
                    index={idx}
                    className="w-full"
                  />
                ))}
              </div>
            )}

            {/* --- VARIANT 2: GRID --- */}
            {variant === "grid" && (
              <div className={cn("grid grid-cols-2 gap-4", gridColsClass)}>
                {images.map((img: any, idx: number) => (
                  <GalleryItem
                    key={idx}
                    img={img}
                    index={idx}
                    className={cn("w-full mb-0", aspectClass)}
                  />
                ))}
              </div>
            )}

            {/* --- VARIANT 3: CAROUSEL --- */}
            {variant === "carousel" && (
              <div className="relative group/carousel">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white rounded-full h-10 w-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 backdrop-blur-sm hidden md:flex border border-white/10"
                  onClick={() => scrollCarousel("left")}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white rounded-full h-10 w-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 backdrop-blur-sm hidden md:flex border border-white/10"
                  onClick={() => scrollCarousel("right")}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>

                <div
                  ref={carouselRef}
                  className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                >
                  {images.map((img: any, idx: number) => (
                    <div
                      key={idx}
                      className="snap-center shrink-0 h-[300px] md:h-[500px]"
                    >
                      <GalleryItem
                        img={img}
                        index={idx}
                        className="h-full w-auto aspect-auto mb-0"
                        imageClass="w-auto h-full object-contain md:object-cover"
                      />
                    </div>
                  ))}
                </div>

                <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-neutral-950 to-transparent pointer-events-none md:block hidden z-10" />
                <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-neutral-950 to-transparent pointer-events-none md:block hidden z-10" />
              </div>
            )}
          </>
        )}
      </div>

      {/* --- LIGHTBOX --- */}
      {lightboxOpen && !isPreview && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300"
          onClick={closeLightbox}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 z-50"
            onClick={closeLightbox}
          >
            <X className="w-8 h-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 z-50 h-12 w-12 rounded-full hidden md:flex"
            onClick={prevImage}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 z-50 h-12 w-12 rounded-full hidden md:flex"
            onClick={nextImage}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>

          <div
            className="relative max-w-7xl max-h-[90vh] w-full p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo(images[currentIndex].url) ? (
              <video
                src={images[currentIndex].url}
                className="max-w-full max-h-[85vh] rounded-md shadow-2xl"
                controls
                autoPlay
              />
            ) : (
              <img
                src={images[currentIndex].url}
                alt="Full Screen"
                className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
              />
            )}

            <div className="absolute -bottom-10 left-0 right-0 text-center text-white/50 text-sm font-mono tracking-widest">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
