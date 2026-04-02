import React from "react";
import { BlockProps } from "../types";
import { cn } from "@/lib/utils";
import { MapPin, Navigation, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
// 🚀 1. IMPORT INLINE EDIT
import { InlineEdit } from "../../components/dashboard/InlineEdit";

// 🚀 2. GRAB id AND isPreview FROM PROPS
const LocationMap: React.FC<any> = ({ data, id, isPreview }) => {
  const variant = data.variant || "standard"; // standard, dark, card
  const isBoxed = variant === "card"; // Only 'card' is boxed now

  const heightClass =
    data.height === "small"
      ? "h-[300px]"
      : data.height === "large"
      ? "h-[70vh]"
      : "h-[50vh] min-h-[400px]";

  // Helper to extract SRC
  const getCleanMapUrl = (input: string) => {
    if (!input) return "";
    const srcMatch = input.match(/src="([^"]+)"/);
    return srcMatch ? srcMatch[1] : input;
  };

  const cleanUrl = getCleanMapUrl(data.mapUrl);

  // LOGIC: Use manual link if provided, otherwise generate search query
  const fallbackQuery = encodeURIComponent(data.address || data.title || "");
  const directionLink =
    data.directionUrl || `https://maps.google.com/?q=${fallbackQuery}`;

  // 🚀 3. EMPTY STATE UX FOR BUILDER
  if (!cleanUrl) {
    if (isPreview) {
      return (
        <section className="py-20 px-4 bg-neutral-950">
          <div className="container mx-auto border-2 border-dashed border-white/20 rounded-3xl p-12 flex flex-col items-center justify-center text-white/50 bg-neutral-900/50">
            <MapPin className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">Location Map</h3>
            <p>
              No map embed URL provided. Hover over this section and click "Edit
              Map" to add it.
            </p>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="relative bg-neutral-950 overflow-hidden">
      {/* Background Noise */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

      {/* Title Section (Always Rendered for Editing) */}
      <div className="container mx-auto px-4 py-12 text-center relative z-10 pointer-events-none">
        <InlineEdit
          tagName="h2"
          className="text-3xl md:text-4xl font-bold tracking-tight text-white block pointer-events-auto w-max mx-auto"
          text={data.title || "Find Us Here"}
          sectionId={id}
          fieldKey="title"
          isPreview={isPreview}
        />
        <div className="h-1 w-20 bg-primary mx-auto rounded-full mt-4" />
      </div>

      <div
        className={cn(
          "relative w-full overflow-hidden group",
          heightClass,
          // Boxed Mode (Card) vs Full Width (Standard/Dark)
          isBoxed
            ? "container mx-auto px-4 rounded-3xl mb-20"
            : "w-full border-y border-white/10"
        )}
      >
        {/* --- THE MAP IFRAME --- */}
        <iframe
          src={cleanUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className={cn(
            "w-full h-full transition-all duration-700",
            // Round corners ONLY if boxed
            isBoxed && "rounded-3xl",
            // Dark Mode Filter
            variant === "dark" &&
              "filter grayscale-[100%] invert-[90%] hue-rotate-180 contrast-[1.2] opacity-80 group-hover:opacity-100 transition-opacity",
            // Card Mode Dimming
            variant === "card" && "opacity-60 grayscale-[50%]"
          )}
          title="Location Map"
        />

        {/* --- VARIANT 1 & 2: FLOATING BUTTON (Standard/Dark) --- */}
        {!isBoxed && (
          <div className="absolute bottom-8 right-8 z-20 pointer-events-auto">
            <Button
              asChild
              size="lg"
              className="shadow-2xl bg-white text-black hover:bg-neutral-200 gap-2 rounded-full px-8 h-12 font-bold transform transition-transform hover:scale-105"
            >
              {/* 🚀 SAFE LINK CLICK */}
              <a
                href={directionLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => isPreview && e.preventDefault()}
              >
                <Navigation className="w-4 h-4" /> Get Directions
              </a>
            </Button>
          </div>
        )}

        {/* --- VARIANT 3: OVERLAY CARD --- */}
        {isBoxed && (
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-20">
            <div className="bg-neutral-950/80 backdrop-blur-md border border-white/10 p-8 rounded-2xl max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-500 pointer-events-auto">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <MapPin className="w-6 h-6" />
              </div>

              <InlineEdit
                tagName="h3"
                className="text-xl font-bold text-white mb-2 block"
                text={data.title || "Our Location"}
                sectionId={id}
                fieldKey="title"
                isPreview={isPreview}
              />

              <InlineEdit
                tagName="p"
                className="text-neutral-300 leading-relaxed text-sm mb-6 block"
                text={data.address || "123 Main St, City, Country"}
                sectionId={id}
                fieldKey="address"
                isPreview={isPreview}
              />

              <Button
                asChild
                className="w-full rounded-full bg-white text-black hover:bg-neutral-200"
              >
                {/* 🚀 SAFE LINK CLICK */}
                <a
                  href={directionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => isPreview && e.preventDefault()}
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Open Maps
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* --- INTERACTION SHIELD --- */}
        {/* Stops map zoom from hijacking page scroll until clicked. */}
        {/* 🚀 If in preview, ALWAYS block clicks so the builder drag-and-drop works! */}
        <div
          className="absolute inset-0 bg-transparent z-10"
          onClick={(e) => {
            if (!isPreview) e.currentTarget.style.pointerEvents = "none";
          }}
          onMouseLeave={(e) => {
            if (!isPreview) e.currentTarget.style.pointerEvents = "auto";
          }}
          title={
            isPreview
              ? "Map interaction disabled in builder mode"
              : "Click map to interact"
          }
        />
      </div>
    </section>
  );
};

export default LocationMap;
