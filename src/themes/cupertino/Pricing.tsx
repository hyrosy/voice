import React from "react";
import { cn } from "@/lib/utils";
import {
  Check,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";
import { UCP } from "@ucp/sdk"; // 🚀 SDK Magic

// 1. DEVELOPER SCHEMA: Apple-inspired controls
export const schema = [
  {
    id: "cardStyle",
    type: "select",
    label: "Card Style",
    options: ["elevated", "flat-bordered", "glass"],
    defaultValue: "elevated",
  },
  {
    id: "accentColor",
    type: "select",
    label: "Accent Color",
    options: ["blue", "indigo", "slate"],
    defaultValue: "blue",
  },
];

export default function CupertinoPricing({
  data,
  settings = {},
  id,
  isPreview,
}: any) {
  const plans = data.plans || [];
  const hasPlans = plans.length > 0;
  const variant = data.variant || "cards";

  // 🚀 SDK HOOK: Handles the slider math perfectly!
  const { carouselRef, scrollCarousel } = UCP.useCarousel();

  if (!hasPlans && !isPreview) return null;

  // Theme styling logic
  const accentClass =
    settings.accentColor === "indigo"
      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
      : settings.accentColor === "slate"
      ? "bg-slate-900 hover:bg-slate-800 text-white"
      : "bg-blue-600 hover:bg-blue-700 text-white"; // Default Blue

  const textAccent =
    settings.accentColor === "indigo"
      ? "text-indigo-600"
      : settings.accentColor === "slate"
      ? "text-slate-900"
      : "text-blue-600";

  const cardBaseClass =
    settings.cardStyle === "flat-bordered"
      ? "bg-white border border-slate-200 shadow-sm"
      : settings.cardStyle === "glass"
      ? "bg-white/60 backdrop-blur-2xl border border-white shadow-xl"
      : "bg-white shadow-[0_20px_40px_rgb(0,0,0,0.06)] border border-transparent";

  // --- SUB-COMPONENT: PRICING CARD ---
  const PricingCard = ({ plan }: { plan: any }) => {
    const isPopular = plan.isPopular;
    const isExternal = plan.buttonUrl?.startsWith("http");
    const linkTarget = isExternal ? "_blank" : "_self";
    const features = (plan.features || "")
      .split(",")
      .map((f: string) => f.trim())
      .filter(Boolean);

    return (
      <div
        className={cn(
          "relative group h-full flex flex-col p-8 md:p-10 rounded-[2.5rem] transition-all duration-500",
          cardBaseClass,
          isPopular &&
            "shadow-[0_30px_60px_rgb(0,0,0,0.12)] scale-[1.02] z-10 border-blue-500/20 ring-1 ring-blue-500/20"
        )}
      >
        {isPopular && (
          <div
            className={cn(
              "absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 whitespace-nowrap z-20",
              accentClass
            )}
          >
            <Sparkles className="w-3.5 h-3.5" /> Popular
          </div>
        )}

        <div className="mb-8 text-center relative z-10">
          <h3
            className={cn(
              "text-sm font-bold uppercase tracking-widest mb-4",
              isPopular ? textAccent : "text-slate-500"
            )}
          >
            {plan.name || "Plan Name"}
          </h3>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl md:text-6xl font-[800] text-slate-900 tracking-tighter">
              {plan.price || "$0"}
            </span>
            {plan.unit && (
              <span className="text-lg text-slate-500 font-medium">
                {plan.unit.startsWith("/") ? plan.unit : `/${plan.unit}`}
              </span>
            )}
          </div>
        </div>

        <div className="h-px w-full bg-slate-100 mb-8" />

        <ul className="space-y-5 flex-grow relative z-10 mb-10">
          {features.map((feat: string, i: number) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-slate-600 font-medium"
            >
              <div
                className={cn(
                  "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                  isPopular ? accentClass : "bg-slate-100 text-slate-400"
                )}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="leading-relaxed">{feat}</span>
            </li>
          ))}
          {features.length === 0 && (
            <li className="text-sm text-slate-400 italic text-center">
              No features listed
            </li>
          )}
        </ul>

        <div className="relative z-10 mt-auto">
          <a
            href={plan.buttonUrl || "#contact"}
            target={linkTarget}
            rel={isExternal ? "noopener noreferrer" : undefined}
            onClick={(e) => isPreview && e.preventDefault()}
            className={cn(
              "flex items-center justify-center w-full h-14 rounded-2xl text-base font-bold transition-all duration-300 hover:scale-105",
              isPopular
                ? cn(accentClass, "shadow-lg")
                : "bg-slate-100 text-slate-900 hover:bg-slate-200"
            )}
          >
            {plan.cta || "Get Started"}
            {isExternal && <ExternalLink className="ml-2 w-4 h-4 opacity-50" />}
          </a>
        </div>
      </div>
    );
  };

  // --- SUB-COMPONENT: RATE CARD ITEM (List Variant) ---
  const RateCardItem = ({ plan }: { plan: any }) => {
    const isExternal = plan.buttonUrl?.startsWith("http");
    const linkTarget = isExternal ? "_blank" : "_self";

    return (
      <div className="group relative border-b border-slate-100 last:border-0 py-6 pointer-events-none md:pointer-events-auto transition-colors hover:bg-slate-50 px-6 -mx-6 rounded-2xl">
        <div className="flex items-end justify-between w-full mb-2 pointer-events-none">
          <div className="flex items-end flex-grow min-w-0">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 shrink-0 pr-4 bg-transparent tracking-tight">
              {plan.name || "Service"}
            </h3>
            <div className="flex-grow border-b-2 border-dotted border-slate-200 relative -top-1.5 opacity-60 hidden md:block mx-2" />
          </div>

          <div
            className={cn(
              "text-2xl md:text-3xl font-[800] shrink-0 pl-4",
              textAccent
            )}
          >
            {plan.price || "$0"}
            {plan.unit && (
              <span className="text-sm text-slate-400 ml-1 font-medium">
                /{plan.unit.replace("/", "")}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <p className="text-slate-500 text-sm leading-relaxed max-w-xl pointer-events-none font-medium">
            {plan.features}
          </p>

          <a
            href={plan.buttonUrl || "#contact"}
            target={linkTarget}
            rel={isExternal ? "noopener noreferrer" : undefined}
            onClick={(e) => isPreview && e.preventDefault()}
            className="flex items-center gap-2 shrink-0 rounded-full border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all pointer-events-auto h-10 px-6 font-bold text-xs uppercase tracking-wider"
          >
            {plan.cta || "Book"}
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  };

  return (
    <section
      className="relative py-24 md:py-32 bg-slate-50 overflow-hidden text-slate-900"
      id="pricing"
    >
      <div className="container max-w-7xl mx-auto relative z-10 px-6">
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-4">
          <UCP.Text
            as="h2"
            field="title"
            value={data.title || "Pricing Plans"}
            sectionId={id}
            isPreview={isPreview}
            className="text-4xl md:text-6xl font-[800] tracking-tighter text-slate-900"
          />
          <UCP.Text
            as="p"
            field="subheadline"
            value={
              data.subheadline || "Simple, transparent pricing. No hidden fees."
            }
            sectionId={id}
            isPreview={isPreview}
            className="text-lg md:text-xl text-slate-500 font-medium"
          />
        </div>

        {hasPlans && (
          <>
            {/* === VARIANT 1: GRID CARDS === */}
            {variant === "cards" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
                {plans.map((plan: any, i: number) => (
                  <PricingCard key={i} plan={plan} />
                ))}
              </div>
            )}

            {/* === VARIANT 2: SLIDER === */}
            {variant === "slider" && (
              <div className="relative group/carousel -mx-6 px-6 md:mx-0 md:px-0">
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/90 hover:bg-white text-slate-900 rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-md shadow-lg border border-slate-200 hover:scale-105 hidden md:flex"
                  onClick={() => scrollCarousel("left")}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/90 hover:bg-white text-slate-900 rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-md shadow-lg border border-slate-200 hover:scale-105 hidden md:flex"
                  onClick={() => scrollCarousel("right")}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>

                <div
                  ref={carouselRef}
                  className="flex overflow-x-auto pb-12 pt-4 gap-6 md:gap-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                >
                  {plans.map((plan: any, i: number) => (
                    <div
                      key={i}
                      className="snap-center shrink-0 w-[85vw] sm:w-[400px] h-auto"
                    >
                      <PricingCard plan={plan} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* === VARIANT 3: RATE CARD LIST === */}
            {variant === "list" && (
              <div
                className={cn(
                  "max-w-4xl mx-auto p-8 md:p-14 rounded-[3rem]",
                  cardBaseClass
                )}
              >
                <div className="space-y-2">
                  {plans.map((plan: any, i: number) => (
                    <RateCardItem key={i} plan={plan} />
                  ))}
                </div>

                <div className="mt-14 text-center pt-8 border-t border-slate-100">
                  <a
                    href={data.ctaLink || "#contact"}
                    onClick={(e) => isPreview && e.preventDefault()}
                    className={cn(
                      "inline-flex items-center justify-center h-14 px-12 rounded-full text-base font-bold transition-all duration-300 hover:scale-105 shadow-md",
                      accentClass
                    )}
                  >
                    <UCP.Text
                      as="span"
                      field="ctaText"
                      value={data.ctaText || "Contact for Custom Rates"}
                      sectionId={id}
                      isPreview={isPreview}
                    />
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

CupertinoPricing.schema = schema;
