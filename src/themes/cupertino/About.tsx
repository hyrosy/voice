import React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { UCP } from "@ucp/sdk"; // 🚀 The Magic Wand

// 1. DEVELOPER SCHEMA: Their unique theme controls
export const schema = [
  {
    id: "glassCard",
    type: "toggle",
    label: "Glassmorphism Cards",
    defaultValue: true,
  },
  {
    id: "imageRadius",
    type: "slider",
    min: 0,
    max: 40,
    label: "Media Corner Radius",
    defaultValue: 24,
  },
  {
    id: "accentStyle",
    type: "select",
    label: "Accent Style",
    options: ["subtle", "vibrant", "monochrome"],
    defaultValue: "subtle",
  },
];

export default function CupertinoAbout({
  data,
  settings = {},
  id,
  isPreview,
}: any) {
  // 1. Core Logic mapping
  const variant = data.variant || "split";
  const isSimple = variant === "simple";
  const isProfile = variant === "profile";
  const isMediaLeft = data.layout === "left";
  const hasMedia = !!data.image;

  // 🚀 SDK Utility
  const isVideoFile = UCP.utils.isVideo(data.image);

  // Theme-specific UI logic
  const accentClass =
    settings.accentStyle === "vibrant"
      ? "text-blue-500"
      : settings.accentStyle === "monochrome"
      ? "text-slate-900"
      : "text-slate-500";

  // --- SUB-COMPONENT: MEDIA BLOCK ---
  const MediaBlock = () => {
    if (!hasMedia) return null;
    return (
      <div
        className={cn(
          "relative w-full max-w-md xl:max-w-lg shadow-2xl overflow-hidden",
          settings.glassCard
            ? "bg-white/40 backdrop-blur-xl border border-white/50 p-2"
            : "bg-slate-100"
        )}
        style={{ borderRadius: `${settings.imageRadius}px` }}
      >
        <div
          className="relative w-full aspect-[4/5] overflow-hidden"
          style={{ borderRadius: `${Math.max(0, settings.imageRadius - 8)}px` }}
        >
          {isVideoFile ? (
            <video
              src={data.image}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={data.image}
              alt="About"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="relative py-24 md:py-32 px-6 bg-slate-50 overflow-hidden text-slate-900">
      <div className="relative container mx-auto z-10 max-w-6xl">
        {/* === VARIANT 1: SIMPLE === */}
        {isSimple ? (
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {data.label && (
              <span
                className={cn(
                  "text-xs font-bold tracking-widest uppercase",
                  accentClass
                )}
              >
                <UCP.Text
                  field="label"
                  value={data.label}
                  sectionId={id}
                  isPreview={isPreview}
                />
              </span>
            )}
            <UCP.Text
              as="h2"
              field="title"
              value={data.title}
              sectionId={id}
              isPreview={isPreview}
              className="text-4xl md:text-6xl font-[800] tracking-tighter text-slate-900"
            />
            <UCP.Text
              as="div"
              field="content"
              value={data.content}
              sectionId={id}
              isPreview={isPreview}
              className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium whitespace-pre-wrap"
            />
          </div>
        ) : (
          /* === VARIANT 2 & 3: SPLIT & PROFILE === */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* MEDIA COLUMN */}
            <div
              className={cn(
                "flex justify-center",
                isMediaLeft
                  ? "lg:order-1 lg:justify-start"
                  : "lg:order-2 lg:justify-end"
              )}
            >
              <MediaBlock />
            </div>

            {/* CONTENT COLUMN */}
            <div
              className={cn(
                "space-y-8",
                isMediaLeft ? "lg:order-2" : "lg:order-1"
              )}
            >
              <div className="space-y-4">
                {data.label && (
                  <span
                    className={cn(
                      "text-xs font-bold tracking-widest uppercase",
                      accentClass
                    )}
                  >
                    <UCP.Text
                      field="label"
                      value={data.label}
                      sectionId={id}
                      isPreview={isPreview}
                    />
                  </span>
                )}
                <UCP.Text
                  as="h2"
                  field="title"
                  value={data.title}
                  sectionId={id}
                  isPreview={isPreview}
                  className="text-4xl md:text-5xl lg:text-6xl font-[800] tracking-tighter text-slate-900 leading-tight"
                />
              </div>

              <UCP.Text
                as="div"
                field="content"
                value={data.content}
                sectionId={id}
                isPreview={isPreview}
                className="text-lg text-slate-600 leading-relaxed font-medium whitespace-pre-wrap"
              />

              {/* FEATURES (Split Variant) */}
              {!isProfile && data.features?.length > 0 && (
                <ul className="grid sm:grid-cols-2 gap-4 pt-2">
                  {data.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2
                        className={cn("w-5 h-5 shrink-0", accentClass)}
                      />
                      <span className="text-slate-700 font-medium">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* STATS (Profile Variant) */}
              {isProfile && data.stats?.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200">
                  {data.stats.map((stat: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <h4 className="text-3xl font-black text-slate-900 tracking-tight">
                        {stat.value}
                      </h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              {data.ctaText && (
                <div className="pt-6">
                  <a
                    href={data.ctaLink || "#"}
                    className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white bg-slate-900 rounded-full hover:bg-slate-800 hover:scale-105 transition-all group"
                  >
                    <UCP.Text
                      as="span"
                      field="ctaText"
                      value={data.ctaText}
                      sectionId={id}
                      isPreview={isPreview}
                    />
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

CupertinoAbout.schema = schema;
