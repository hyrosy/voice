import React from "react";
import { cn } from "@/lib/utils";
import { MapPin, Navigation, Map } from "lucide-react";
import { UCP } from "@ucp/sdk"; // 🚀 SDK Magic

// 1. DEVELOPER SCHEMA
export const schema = [
  {
    id: "mapRadius",
    type: "select",
    label: "Corner Radius",
    options: ["square", "rounded", "pill"],
    defaultValue: "rounded",
  },
  {
    id: "glassIntensity",
    type: "select",
    label: "Glass Effect",
    options: ["light", "heavy"],
    defaultValue: "heavy",
  },
];

export default function CupertinoMap({
  data,
  settings = {},
  id,
  isPreview,
}: any) {
  const variant = data.variant || "standard";
  const isBoxed = variant === "card";

  const heightClass =
    data.height === "small"
      ? "h-[350px]"
      : data.height === "large"
      ? "h-[70vh] min-h-[600px]"
      : "h-[50vh] min-h-[450px]";

  // 🚀 SDK: Effortlessly parse the messy iframe and generate directions!
  const cleanUrl = UCP.utils.extractIframeSrc(data.mapUrl);
  const directionLink = UCP.utils.getGoogleMapsLink(
    data.address || data.title,
    data.directionUrl
  );

  // Styling based on Schema
  const radiusClass =
    settings.mapRadius === "square"
      ? "rounded-none"
      : settings.mapRadius === "pill"
      ? "rounded-[3rem]"
      : "rounded-3xl";

  const glassClass =
    settings.glassIntensity === "light"
      ? "bg-white/60 backdrop-blur-md"
      : "bg-white/90 backdrop-blur-xl";

  if (!cleanUrl) {
    if (isPreview) {
      return (
        <section className="py-24 px-6 bg-slate-50">
          <div className="container mx-auto border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-slate-400 bg-white">
            <Map className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-semibold text-slate-600">
              Map Needs Configuration
            </p>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="relative py-24 md:py-32 bg-slate-50 overflow-hidden text-slate-900 pb-0">
      {/* HEADER */}
      <div className="container mx-auto px-6 mb-12 text-center relative z-10">
        <UCP.Text
          as="h2"
          field="title"
          value={data.title || "Visit Us"}
          sectionId={id}
          isPreview={isPreview}
          className="text-4xl md:text-5xl font-[800] tracking-tighter text-slate-900"
        />
      </div>

      {/* MAP CONTAINER */}
      <div
        className={cn(
          "relative w-full flex items-center justify-center",
          heightClass,
          isBoxed ? "container mx-auto px-6 pb-24" : "w-full"
        )}
      >
        <div
          className={cn(
            "relative w-full h-full overflow-hidden shadow-sm",
            isBoxed && cn(radiusClass, "shadow-xl border border-slate-200")
          )}
        >
          {/* iframe rendering */}
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
              variant === "dark" &&
                "filter grayscale-[80%] contrast-[1.1] opacity-90", // Softer dark for light theme
              variant === "card" && "opacity-80"
            )}
            title="Location Map"
          />

          {/* FLOATING BUTTON (Standard/Dark variants) */}
          {!isBoxed && (
            <div className="absolute bottom-8 right-8 z-20 pointer-events-auto">
              <a
                href={directionLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => isPreview && e.preventDefault()}
                className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full px-8 h-14 font-semibold border border-slate-100"
              >
                <Navigation className="w-5 h-5" /> Get Directions
              </a>
            </div>
          )}

          {/* OVERLAY CARD VARIANT */}
          {isBoxed && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none z-20">
              <div
                className={cn(
                  "p-10 rounded-[2.5rem] max-w-sm w-full text-center shadow-[0_20px_40px_rgb(0,0,0,0.08)] pointer-events-auto border border-white transition-all",
                  glassClass
                )}
              >
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                  <MapPin className="w-6 h-6" />
                </div>

                <UCP.Text
                  as="h3"
                  field="title"
                  value={data.title || "Our Studio"}
                  sectionId={id}
                  isPreview={isPreview}
                  className="text-2xl font-[800] text-slate-900 mb-2 tracking-tight"
                />

                <UCP.Text
                  as="p"
                  field="address"
                  value={
                    data.address || "123 Creative Ave\nCupertino, CA 95014"
                  }
                  sectionId={id}
                  isPreview={isPreview}
                  className="text-slate-500 font-medium text-sm mb-8 leading-relaxed whitespace-pre-line"
                />

                <a
                  href={directionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => isPreview && e.preventDefault()}
                  className="flex items-center justify-center w-full rounded-full bg-blue-600 text-white hover:bg-blue-700 h-12 font-semibold transition-all hover:scale-105 shadow-md"
                >
                  <Navigation className="w-4 h-4 mr-2" /> Open Maps
                </a>
              </div>
            </div>
          )}

          {/* Interaction Shield */}
          <div
            className="absolute inset-0 bg-transparent z-10"
            onClick={(e) => {
              if (!isPreview) e.currentTarget.style.pointerEvents = "none";
            }}
            onMouseLeave={(e) => {
              if (!isPreview) e.currentTarget.style.pointerEvents = "auto";
            }}
            title={
              isPreview ? "Map disabled in builder mode" : "Click to interact"
            }
          />
        </div>
      </div>
    </section>
  );
}

CupertinoMap.schema = schema;