// src/lib/ucp-sdk/hooks/useGallery.ts
import { useState, useEffect, useRef, useCallback } from "react";

export const useGallery = (images: any[] = [], isPreview: boolean = false) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const openLightbox = useCallback(
    (index: number) => {
      if (isPreview) return;
      setCurrentIndex(index);
      setLightboxOpen(true);
      document.body.style.overflow = "hidden";
    },
    [isPreview]
  );

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = "auto";
  }, []);

  const nextImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % images.length);
    },
    [images.length]
  );

  const prevImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, closeLightbox, nextImage, prevImage]);

  const scrollCarousel = useCallback((direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth * 0.6;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  return {
    lightboxOpen,
    currentIndex,
    currentImage: images[currentIndex] || null,
    carouselRef,
    openLightbox,
    closeLightbox,
    nextImage,
    prevImage,
    scrollCarousel,
  };
};
