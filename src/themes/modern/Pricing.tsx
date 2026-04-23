import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineEdit } from "../../components/dashboard/InlineEdit";

const Pricing: React.FC<any> = ({ data, id, isPreview }) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const plans = data.plans || [];
  const hasPlans = plans.length > 0;
  const variant = data.variant || "cards";

  if (!hasPlans && !isPreview) return null;

  // --- SCROLL LOGIC ---
  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const amount = carouselRef.current.clientWidth * 0.8;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  // --- SUB-COMPONENT: PRICING CARD ---
  const PricingCard = ({ plan }: { plan: any }) => {
    const isPopular = plan.isPopular;
    const isExternal = plan.buttonUrl?.startsWith("http");
    const linkTarget = isExternal ? "_blank" : "_self";

    // 🚀 FIX: Safely parse features to avoid empty bullet points
    const features = (plan.features || "")
      .split(",")
      .map((f: string) => f.trim())
      .filter(Boolean);

    return (
      <div
        className={cn(
          "relative group h-full flex flex-col p-8 md:p-10 rounded-[2.5rem] transition-all duration-700 border",
          isPopular
            ? "bg-neutral-900 border-primary/50 shadow-2xl scale-[1.02] z-10 ring-1 ring-primary/20"
            : "bg-neutral-900/40 border-white/10 hover:border-white/20 hover:bg-neutral-900/60"
        )}
      >
        {/* Glow for Popular */}
        {isPopular && (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none rounded-[2.5rem]" />
        )}

        {/* Badge */}
        {isPopular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 text-black px-5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 whitespace-nowrap z-20">
            <Sparkles className="w-3.5 h-3.5 fill-black" /> Popular
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center relative z-10 pointer-events-none">
          <h3 className="text-sm font-mono text-primary uppercase tracking-widest mb-4 font-bold">
            {plan.name || "Plan Name"}
          </h3>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl md:text-6xl font-black text-white tracking-tighter">
              {plan.price || "$0"}
            </span>
            {plan.unit && (
              <span className="text-lg text-neutral-400 font-medium">
                {plan.unit.startsWith("/") ? plan.unit : `/${plan.unit}`}
              </span>
            )}
          </div>
        </div>

        {/* Features Divider */}
        <div
          className={cn(
            "h-px w-full mb-8",
            isPopular ? "bg-primary/30" : "bg-white/10"
          )}
        />

        {/* Features List */}
        <ul className="space-y-4 flex-grow relative z-10 mb-10 pointer-events-none">
          {features.map((feat: string, i: number) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-neutral-300 font-medium"
            >
              <div
                className={cn(
                  "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                  isPopular ? "bg-primary text-black" : "bg-white/10 text-white"
                )}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="opacity-90 leading-relaxed">{feat}</span>
            </li>
          ))}
          {features.length === 0 && (
            <li className="text-sm text-neutral-500 italic text-center">
              No features listed
            </li>
          )}
        </ul>

        {/* Button */}
        <div className="relative z-10 mt-auto">
          <Button
            asChild
            className={cn(
              "w-full h-14 rounded-2xl text-base font-bold transition-all duration-300 hover:scale-105",
              isPopular
                ? "bg-primary hover:bg-primary/90 text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                : "bg-white text-black hover:bg-neutral-200 shadow-xl"
            )}
          >
            <a
              href={plan.buttonUrl || "#contact"}
              target={linkTarget}
              rel={isExternal ? "noopener noreferrer" : undefined}
              onClick={(e) => isPreview && e.preventDefault()}
            >
              {plan.cta || "Get Started"}
              {isExternal && (
                <ExternalLink className="ml-2 w-4 h-4 opacity-50" />
              )}
            </a>
          </Button>
        </div>
      </div>
    );
  };

  // --- COMPONENT: RATE CARD ITEM ---
  const RateCardItem = ({ plan }: { plan: any }) => {
    const isExternal = plan.buttonUrl?.startsWith("http");
    const linkTarget = isExternal ? "_blank" : "_self";

    return (
      <div className="group relative border-b border-white/10 last:border-0 py-8 pointer-events-none md:pointer-events-auto transition-colors hover:bg-white/[0.02] px-4 -mx-4 rounded-2xl">
        <div className="flex items-end justify-between w-full mb-3 pointer-events-none">
          <div className="flex items-end flex-grow min-w-0">
            <h3 className="text-xl md:text-2xl font-bold text-white shrink-0 pr-4 bg-transparent tracking-tight">
              {plan.name || "Service"}
            </h3>
            {/* Dotted Leader */}
            <div className="flex-grow border-b-2 border-dotted border-white/20 relative -top-1.5 opacity-40 hidden md:block mx-2" />
          </div>

          <div className="text-2xl md:text-3xl font-mono text-primary font-bold shrink-0 pl-4">
            {plan.price || "$0"}
            {plan.unit && (
              <span className="text-sm text-neutral-500 ml-1 font-sans">
                /{plan.unit.replace("/", "")}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <p className="text-neutral-400 text-sm leading-relaxed max-w-xl pointer-events-none font-medium">
            {plan.features}
          </p>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="shrink-0 rounded-full border-white/20 text-neutral-300 hover:text-white hover:border-primary hover:bg-primary/10 transition-all pointer-events-auto h-10 px-6"
          >
            <a
              href={plan.buttonUrl || "#contact"}
              target={linkTarget}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="flex items-center gap-2"
              onClick={(e) => isPreview && e.preventDefault()}
            >
              <span className="text-xs uppercase tracking-wider font-bold">
                {plan.cta || "Book"}
              </span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <section
      className="relative py-24 md:py-32 bg-neutral-950 overflow-hidden"
      id="pricing"
    >
      {/* Background Texture & Glow */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container max-w-7xl mx-auto relative z-10 px-6">
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-4">
            <InlineEdit
              tagName="h2"
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter block leading-tight"
              text={data.title || "Pricing Plans"}
              sectionId={id}
              fieldKey="title"
              isPreview={isPreview}
            />
          </div>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full" />

          {/* 🚀 NEW: Subheadline */}
          <InlineEdit
            tagName="p"
            className="text-lg md:text-xl text-neutral-400 font-medium block"
            text={
              data.subheadline || "Simple, transparent pricing. No hidden fees."
            }
            sectionId={id}
            fieldKey="subheadline"
            isPreview={isPreview}
          />
        </div>

        {/* 🚀 EMPTY STATE UX */}
        {!hasPlans && isPreview && (
          <div className="w-full py-24 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-white/40 bg-white/5 backdrop-blur-sm">
            <Tag className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium tracking-wide">
              No pricing plans added yet.
            </p>
            <p className="text-xs mt-2 opacity-70">
              Hover over this section and click "Design" to add plans.
            </p>
          </div>
        )}

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

            {/* === VARIANT 2: SLIDER (Carousel) === */}
            {variant === "slider" && (
              <div className="relative group/carousel -mx-6 px-6 md:mx-0 md:px-0">
                {/* Native Buttons */}
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-md hidden md:flex border border-white/10 shadow-2xl hover:scale-105"
                  onClick={() => scrollCarousel("left")}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-md hidden md:flex border border-white/10 shadow-2xl hover:scale-105"
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

                {/* Fade Edges */}
                <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-neutral-950 to-transparent pointer-events-none md:block hidden z-10" />
                <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-neutral-950 to-transparent pointer-events-none md:block hidden z-10" />
              </div>
            )}

            {/* === VARIANT 3: RATE CARD (List) === */}
            {variant === "list" && (
              <div className="max-w-4xl mx-auto bg-neutral-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-14 shadow-2xl ring-1 ring-white/5">
                <div className="space-y-2">
                  {plans.map((plan: any, i: number) => (
                    <RateCardItem key={i} plan={plan} />
                  ))}
                </div>

                <div className="mt-14 text-center pt-8 border-t border-white/10">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full px-12 h-14 bg-white text-black hover:bg-neutral-200 shadow-xl transition-all hover:scale-105 font-bold"
                  >
                    <a
                      href={data.ctaLink || "#contact"}
                      onClick={(e) => isPreview && e.preventDefault()}
                    >
                      <InlineEdit
                        tagName="span"
                        text={data.ctaText || "Contact for Custom Rates"}
                        sectionId={id}
                        fieldKey="ctaText"
                        isPreview={isPreview}
                      />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Pricing;
