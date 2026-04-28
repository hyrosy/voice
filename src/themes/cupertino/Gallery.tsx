import React from "react";
import { cn } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { UCP } from "@ucp/sdk"; // 🚀 The Magic Wand

// 1. DEVELOPER SCHEMA: Apple-inspired controls
export const schema = [
  {
    id: "glassmorphism",
    type: "toggle",
    label: "Glassmorphism Cards",
    defaultValue: true,
  },
  {
    id: "gapSize",
    type: "select",
    label: "Grid Gap",
    options: ["small", "medium", "large"],
    defaultValue: "medium",
  },
  {
    id: "cornerRadius",
    type: "slider",
    min: 0,
    max: 40,
    label: "Corner Radius",
    defaultValue: 20,
  },
];

export default function CupertinoGallery({
  data,
  settings = {},
  id,
  isPreview,
}: any) {
  const images = data.images || [];
  const hasImages = images.length > 0;
  const variant = data.variant || "grid";

  // 🚀 SDK HOOK: All the complex logic handled instantly!
  const {
    lightboxOpen,
    currentIndex,
    currentImage,
    carouselRef,
    openLightbox,
    closeLightbox,
    nextImage,
    prevImage,
    scrollCarousel,
  } = UCP.useGallery(images, isPreview);

  if (!hasImages && !isPreview) return null;

  // Layout Mappers
  const gapClass =
    settings.gapSize === "small"
      ? "gap-2"
      : settings.gapSize === "large"
      ? "gap-8"
      : "gap-4";

  const aspectClass =
    data.aspectRatio === "portrait"
      ? "aspect-[4/5]"
      : data.aspectRatio === "landscape"
      ? "aspect-video"
      : "aspect-square";

  const gridColsClass =
    data.gridColumns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : data.gridColumns === 4
      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";

  // Shared Gallery Item Component
  const GalleryItem = ({ img, idx, className }: any) => {
    const ytId = UCP.utils.getYoutubeId(img.url);
    const isVid = UCP.utils.isVideo(img.url);

    return (
      <div
        className={cn(
          "relative overflow-hidden cursor-pointer group transition-all duration-500",
          settings.glassmorphism
            ? "bg-white/40 backdrop-blur-md border border-white/50 shadow-sm hover:shadow-xl"
            : "bg-slate-100",
          className
        )}
        style={{ borderRadius: `${settings.cornerRadius}px` }}
        onClick={() => openLightbox(idx)}
      >
        <div className="relative w-full h-full p-1.5 rounded-[inherit]">
          <div
            className="relative w-full h-full overflow-hidden"
            style={{
              borderRadius: `${Math.max(0, settings.cornerRadius - 6)}px`,
            }}
          >
            {ytId ? (
              <>
                <img
                  src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="YT"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-transparent transition-colors">
                  <div className="bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg text-slate-900 group-hover:scale-110 transition-transform">
                    <Play size={16} fill="currentColor" className="ml-1" />
                  </div>
                </div>
              </>
            ) : isVid ? (
              <video
                src={img.url}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                muted
                autoPlay
                loop
                playsInline
              />
            ) : (
              <img
                src={img.url}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt={`Item ${idx}`}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-24 md:py-32 px-6 bg-slate-50 text-slate-900 relative">
      <div className="container mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-12 text-center space-y-4">
          <UCP.Text
            as="h2"
            field="title"
            value={data.title || "Gallery"}
            sectionId={id}
            isPreview={isPreview}
            className="text-4xl md:text-5xl font-[800] tracking-tighter text-slate-900"
          />
        </div>

        {/* GRID LAYOUTS */}
        {hasImages && variant === "masonry" && (
          <div
            className={cn(
              "columns-1 sm:columns-2 md:columns-3 lg:columns-4 space-y-4",
              gapClass
            )}
          >
            {images.map((img: any, idx: number) => (
              <GalleryItem
                key={idx}
                img={img}
                idx={idx}
                className="w-full break-inside-avoid"
              />
            ))}
          </div>
        )}

        {hasImages && variant === "grid" && (
          <div className={cn("grid", gridColsClass, gapClass)}>
            {images.map((img: any, idx: number) => (
              <GalleryItem
                key={idx}
                img={img}
                idx={idx}
                className={cn("w-full", aspectClass)}
              />
            ))}
          </div>
        )}

        {/* CAROUSEL LAYOUT */}
        {hasImages && variant === "carousel" && (
          <div className="relative group/carousel -mx-6 px-6 md:mx-0 md:px-0">
            <button
              onClick={() => scrollCarousel("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/80 hover:bg-white text-slate-900 rounded-full h-12 w-12 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-xl shadow-lg border border-slate-200 hover:scale-105 hidden md:flex"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scrollCarousel("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/80 hover:bg-white text-slate-900 rounded-full h-12 w-12 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-xl shadow-lg border border-slate-200 hover:scale-105 hidden md:flex"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div
              ref={carouselRef}
              className={cn(
                "flex overflow-x-auto pb-8 pt-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden",
                gapClass
              )}
            >
              {images.map((img: any, idx: number) => (
                <div
                  key={idx}
                  className="snap-center shrink-0 h-[400px] md:h-[500px]"
                >
                  <GalleryItem
                    img={img}
                    idx={idx}
                    className="h-full w-auto aspect-auto"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIGHTBOX (Powered by SDK) */}
        {lightboxOpen &&
          !isPreview &&
          currentImage &&
          (() => {
            const ytId = UCP.utils.getYoutubeId(currentImage.url);
            const isVid = UCP.utils.isVideo(currentImage.url);

            return (
              <div
                className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center animate-in fade-in duration-300"
                onClick={closeLightbox}
              >
                <button
                  onClick={closeLightbox}
                  className="absolute top-6 right-6 text-white/50 hover:text-white z-[99] p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <button
                  onClick={prevImage}
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-[99] h-14 w-14 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 hover:scale-105 transition-all text-white hidden md:flex"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-[99] h-14 w-14 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 hover:scale-105 transition-all text-white hidden md:flex"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>

                <div
                  className="relative max-w-6xl max-h-[85vh] w-full p-4 flex flex-col items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/20 flex items-center justify-center w-full bg-black/50">
                    {ytId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                        className="w-full aspect-video max-w-5xl bg-black rounded-2xl"
                        allow="autoplay; fullscreen"
                      />
                    ) : isVid ? (
                      <video
                        src={currentImage.url}
                        className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                        controls
                        autoPlay
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={currentImage.url}
                        className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                        alt="Fullscreen"
                      />
                    )}
                  </div>
                  <div className="absolute bottom-2 left-0 right-0 text-center text-white/70 font-semibold text-sm">
                    {currentIndex + 1} of {images.length}
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </section>
  );
}

CupertinoGallery.schema = schema;
