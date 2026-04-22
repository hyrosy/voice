import { useState, useEffect } from "react";

export function useDeviceSize(ref?: React.RefObject<HTMLElement>) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = (width: number) => setIsMobile(width < 768);

    // 1. Check window resize (for normal viewing)
    const handleResize = () => checkWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    if (typeof window !== "undefined") checkWidth(window.innerWidth);

    // 2. Check element resize (for iframe builder toggles)
    let observer: ResizeObserver | null = null;
    if (ref && ref.current) {
      observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          checkWidth(entry.contentRect.width);
        }
      });
      observer.observe(ref.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer) observer.disconnect();
    };
  }, [ref]);

  return { isMobile };
}
