import React from "react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk"; // 🚀 The magic SDK bridge!

export const schema = [
  {
    id: "headline",
    type: "string",
    label: "Headline",
    defaultValue: "Design that speaks.",
  },
  {
    id: "subheadline",
    type: "string",
    label: "Subheadline",
    defaultValue:
      "Create stunning, minimalist portfolios in seconds with our new engine.",
  },
  {
    id: "label",
    type: "string",
    label: "Eyebrow Label",
    defaultValue: "New Release",
  },
  {
    id: "ctaText",
    type: "string",
    label: "Primary Button",
    defaultValue: "Get Started",
  },
  {
    id: "secondaryCtaText",
    type: "string",
    label: "Secondary Button",
    defaultValue: "Learn More",
  },
  {
    id: "alignment",
    type: "select",
    options: ["center", "left"],
    label: "Text Alignment",
    defaultValue: "center",
  },
  {
    id: "showGradient",
    type: "toggle",
    label: "Show Mesh Gradient",
    defaultValue: true,
  },
];

export default function Hero({ data, settings = {}, id, isPreview }: any) {
  const align = settings.alignment || "center";

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-white pt-20">
      {/* 1. Mesh Gradient Blobs */}
      {settings.showGradient && (
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] animate-pulse" />
      )}
      {settings.showGradient && (
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[100px]" />
      )}

      <div
        className={cn(
          "container mx-auto px-6 relative z-10",
          align === "center" ? "text-center" : "text-left"
        )}
      >
        {/* Eyebrow - Small Capsule */}
        <div
          className={cn(
            "mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700",
            align === "center" && "mx-auto"
          )}
        >
          <span className="px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-widest text-gray-500 inline-block">
            <UCP.Text
              field="label"
              default="New Release"
              sectionId={id}
              isPreview={isPreview}
            />
          </span>
        </div>

        {/* Massive Typography (Inter/SF Pro vibe) */}
        <UCP.Text
          as="h1"
          field="headline"
          default="Design that speaks."
          sectionId={id}
          isPreview={isPreview}
          className="text-6xl md:text-8xl font-[800] tracking-tighter text-slate-900 leading-[0.95] mb-6 animate-in fade-in zoom-in-95 duration-1000 inline-block"
        />

        <UCP.Text
          as="p"
          field="subheadline"
          default="Create stunning, minimalist portfolios in seconds with our new engine."
          sectionId={id}
          isPreview={isPreview}
          className={cn(
            "text-xl md:text-2xl text-slate-500 max-w-2xl font-medium leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200",
            align === "center" && "mx-auto"
          )}
        />

        {/* Apple-style Buttons */}
        <div
          className={cn(
            "flex gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300",
            align === "center" && "justify-center"
          )}
        >
          <button className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold text-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.02] transition-all">
            <UCP.Text
              as="span"
              field="ctaText"
              default="Get Started"
              sectionId={id}
              isPreview={isPreview}
            />
          </button>

          <button className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-semibold text-lg hover:bg-slate-50 transition-all">
            <UCP.Text
              as="span"
              field="secondaryCtaText"
              default="Learn More"
              sectionId={id}
              isPreview={isPreview}
            />{" "}
            &rarr;
          </button>
        </div>

        {/* Product Image Floating Up */}
        {data.backgroundImage && (
          <div className="mt-20 relative mx-auto max-w-5xl rounded-t-3xl overflow-hidden shadow-2xl border-t border-x border-gray-200 animate-in slide-in-from-bottom-20 duration-1000 delay-500">
            <img src={data.backgroundImage} className="w-full object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}

// 🚀 Must explicitly set the schema property on the default export!
Hero.schema = schema;
