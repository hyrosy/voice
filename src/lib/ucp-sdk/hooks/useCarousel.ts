// src/lib/ucp-sdk/hooks/useCarousel.ts
import { useRef, useCallback } from "react";

export const useCarousel = () => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = useCallback(
    (direction: "left" | "right", scrollRatio: number = 0.8) => {
      if (carouselRef.current) {
        // Scrolls by a percentage of the visible container width
        const scrollAmount = carouselRef.current.clientWidth * scrollRatio;
        carouselRef.current.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    },
    []
  );

  return { carouselRef, scrollCarousel };
};
