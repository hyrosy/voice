import React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Check,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Loader2,
  X,
  Send,
  CheckCircle2,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  User,
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

// Helper to get icon for field type
const getFieldIcon = (type: string) => {
  switch (type) {
    case "email":
      return <Mail size={14} />;
    case "tel":
      return <Phone size={14} />;
    case "textarea":
      return <MessageSquare size={14} />;
    case "date":
      return <Calendar size={14} />;
    default:
      return <User size={14} />;
  }
};

// ==========================================
// 2. THE COMPONENT
// ==========================================
export default function CupertinoPricing({
  data,
  settings = {},
  id,
  isPreview,
  actorId,
  portfolioId,
}: any) {
  const plans = data.plans || [];
  const hasPlans = plans.length > 0;
  const variant = data.variant || "cards";

  // 🚀 SDK HOOKS
  const { carouselRef, scrollCarousel } = UCP.useCarousel();

  const {
    activePlan,
    formTemplate,
    isModalOpen,
    setIsModalOpen,
    isLoadingForm,
    isSubmitting,
    isSuccess,
    formValues,
    setFormValues,
    handlePlanAction,
    handleFormSubmit,
    parseOptions,
  } = UCP.usePricingForm({ actorId, portfolioId, isPreview });

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

  // Shared iOS Input Class
  const iosInputClass =
    "w-full bg-slate-100/80 hover:bg-slate-200/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-transparent text-slate-900 h-12 rounded-xl px-4 text-sm transition-all outline-none";

  // --- SUB-COMPONENT: PRICING CARD ---
  const PricingCard = ({ plan }: { plan: any }) => {
    const isPopular = plan.isPopular;
    const isExternal =
      plan.actionType !== "form" && plan.buttonUrl?.startsWith("http");
    const linkTarget = isExternal ? "_blank" : "_self";
    const href =
      plan.actionType === "form" ? "#" : plan.buttonUrl || "#contact";

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
            href={href}
            target={linkTarget}
            rel={isExternal ? "noopener noreferrer" : undefined}
            onClick={(e) => handlePlanAction(plan, e)}
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

  // --- SUB-COMPONENT: RATE CARD ITEM ---
  const RateCardItem = ({ plan }: { plan: any }) => {
    const isExternal =
      plan.actionType !== "form" && plan.buttonUrl?.startsWith("http");
    const linkTarget = isExternal ? "_blank" : "_self";
    const href =
      plan.actionType === "form" ? "#" : plan.buttonUrl || "#contact";

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
            href={href}
            target={linkTarget}
            rel={isExternal ? "noopener noreferrer" : undefined}
            onClick={(e) => handlePlanAction(plan, e)}
            className="flex items-center gap-2 shrink-0 rounded-full border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all pointer-events-auto h-10 px-6 font-bold text-xs uppercase tracking-wider"
          >
            {plan.cta || "Book"}
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  };

  const showImageCover = formTemplate?.image && !isLoadingForm && !isSuccess;

  return (
    <>
      {/* 🚀 THE CUPERTINO FORM MODAL (Light Mode, Frosted Glass) */}
      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 sm:bg-slate-900/60 backdrop-blur-sm cursor-pointer animate-in fade-in duration-500"
              onClick={() => setIsModalOpen(false)}
            />

            <div
              className={cn(
                "relative w-full bg-white/95 backdrop-blur-2xl border-t sm:border border-white shadow-[0_-20px_50px_rgba(0,0,0,0.1)] sm:shadow-2xl rounded-t-[2rem] sm:rounded-[2.5rem] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 max-h-[92vh] sm:max-h-[90vh] flex flex-col sm:flex-row overflow-hidden",
                showImageCover ? "sm:max-w-5xl" : "sm:max-w-2xl"
              )}
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-300 rounded-full sm:hidden pointer-events-none z-50" />

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute top-4 right-4 sm:top-6 sm:right-6 rounded-full z-50 transition-colors",
                  showImageCover
                    ? "text-white bg-black/20 hover:bg-black/50 backdrop-blur-md"
                    : "text-slate-400 hover:text-slate-900 bg-slate-100 sm:bg-transparent hover:bg-slate-200"
                )}
                onClick={() => setIsModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>

              {/* DESKTOP IMAGE PANEL */}
              {showImageCover && (
                <div className="hidden sm:flex sm:w-2/5 relative bg-slate-100 shrink-0 flex-col justify-end p-8">
                  <img
                    src={formTemplate.image}
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  <div className="relative z-10 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-white/20 mb-2">
                      Selected Plan
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
                      {activePlan?.name}
                    </h3>
                    <p className="text-white/90 font-mono font-bold text-2xl drop-shadow-md">
                      {activePlan?.price}
                      {activePlan?.unit && (
                        <span className="text-sm font-sans ml-1">
                          /{activePlan.unit.replace("/", "")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* SCROLLABLE FORM CONTAINER */}
              <div
                className={cn(
                  "flex-grow overflow-y-auto flex flex-col pt-14 pb-6 px-6 sm:p-10",
                  "*[scrollbar-width:thin] *[scrollbar-color:rgba(0,0,0,0.1)_transparent]",
                  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
                  "[&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full",
                  showImageCover ? "sm:w-3/5 sm:pt-10" : "w-full"
                )}
              >
                {isLoadingForm ? (
                  <div
                    className={cn(
                      "py-20 flex flex-col items-center justify-center h-full",
                      textAccent
                    )}
                  >
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="text-sm text-slate-500 font-medium">
                      Loading form...
                    </p>
                  </div>
                ) : !formTemplate ? (
                  <div className="py-20 text-center h-full flex flex-col items-center justify-center">
                    <p className="text-slate-500">
                      Form template could not be loaded.
                    </p>
                  </div>
                ) : isSuccess ? (
                  <div className="py-16 text-center space-y-4 animate-in zoom-in-95 h-full flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2
                        size={40}
                        className="animate-in zoom-in duration-500 delay-150"
                      />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                      {formTemplate.success_title || "Request Sent!"}
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      {formTemplate.success_message ||
                        `Thanks for inquiring about the ${activePlan?.name} plan. We'll be in touch.`}
                    </p>
                    <Button
                      className="mt-6 h-12 rounded-full px-8 bg-slate-900 text-white hover:bg-slate-800 font-bold"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Close Window
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8 mt-auto mb-auto">
                    <div
                      className={cn(
                        "text-left space-y-3 mb-8 pr-10 sm:pr-0",
                        !showImageCover && "sm:text-center"
                      )}
                    >
                      {!showImageCover && (
                        <div
                          className={cn(
                            "inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500"
                          )}
                        >
                          Requesting: {activePlan?.name}
                        </div>
                      )}
                      <h3
                        className={cn(
                          "text-3xl font-bold text-slate-900 tracking-tight",
                          !showImageCover && "sm:text-4xl"
                        )}
                      >
                        {formTemplate.title || "Let's get started"}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-500">
                        {formTemplate.subheadline ||
                          "Fill out the details below to proceed."}
                      </p>
                    </div>

                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        {(formTemplate.fields || []).map(
                          (field: any, idx: number) => {
                            const isHalf = field.width === "half";
                            const fieldOptions = parseOptions(field.options);

                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "space-y-2.5",
                                  isHalf
                                    ? "col-span-1"
                                    : "col-span-1 sm:col-span-2"
                                )}
                              >
                                <Label className="text-slate-600 flex items-center gap-2 text-xs uppercase tracking-widest font-bold ml-1">
                                  {getFieldIcon(field.type)} {field.label}{" "}
                                  {field.required && (
                                    <span className={textAccent}>*</span>
                                  )}
                                </Label>

                                {field.type === "textarea" ? (
                                  <Textarea
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    className={cn(
                                      iosInputClass,
                                      "min-h-[120px] resize-none py-4"
                                    )}
                                    value={formValues[field.id] || ""}
                                    onChange={(e) =>
                                      setFormValues({
                                        ...formValues,
                                        [field.id]: e.target.value,
                                      })
                                    }
                                  />
                                ) : field.type === "select" ? (
                                  <div className="relative">
                                    <select
                                      required={field.required}
                                      className={cn(
                                        iosInputClass,
                                        "appearance-none"
                                      )}
                                      value={formValues[field.id] || ""}
                                      onChange={(e) =>
                                        setFormValues({
                                          ...formValues,
                                          [field.id]: e.target.value,
                                        })
                                      }
                                    >
                                      <option value="" disabled>
                                        Select...
                                      </option>
                                      {fieldOptions.map(
                                        (opt: string, i: number) => (
                                          <option key={i} value={opt}>
                                            {opt}
                                          </option>
                                        )
                                      )}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="m6 9 6 6 6-6" />
                                      </svg>
                                    </div>
                                  </div>
                                ) : field.type === "radio" ? (
                                  <div className="flex flex-col gap-2 pt-1">
                                    {fieldOptions.map(
                                      (opt: string, i: number) => (
                                        <label
                                          key={i}
                                          className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors has-[:checked]:bg-blue-50 has-[:checked]:border-blue-200"
                                        >
                                          <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-slate-300 group-hover:border-blue-400 bg-white">
                                            <input
                                              type="radio"
                                              name={field.id}
                                              value={opt}
                                              required={field.required}
                                              className="peer sr-only"
                                              onChange={(e) =>
                                                setFormValues({
                                                  ...formValues,
                                                  [field.id]: e.target.value,
                                                })
                                              }
                                            />
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" />
                                          </div>
                                          <span className="text-slate-700 text-sm font-medium">
                                            {opt}
                                          </span>
                                        </label>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <Input
                                    required={field.required}
                                    type={
                                      field.type === "email"
                                        ? "email"
                                        : field.type === "tel"
                                        ? "tel"
                                        : field.type === "date"
                                        ? "date"
                                        : "text"
                                    }
                                    placeholder={field.placeholder}
                                    className={iosInputClass}
                                    value={formValues[field.id] || ""}
                                    onChange={(e) =>
                                      setFormValues({
                                        ...formValues,
                                        [field.id]: e.target.value,
                                      })
                                    }
                                  />
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>

                      <div className="pt-6 sm:pt-4">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className={cn(
                            "w-full h-16 sm:h-14 text-lg sm:text-base font-bold rounded-2xl sm:rounded-xl transition-transform hover:scale-[1.02] shadow-lg group",
                            accentClass
                          )}
                        >
                          {isSubmitting ? (
                            <Loader2 className="animate-spin mr-2 w-5 h-5" />
                          ) : (
                            <Send className="mr-3 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          )}
                          {formTemplate.button_text || "Submit Request"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 🚀 THE ACTUAL PRICING SECTION */}
      <section
        className="relative py-24 md:py-32 bg-slate-50 overflow-hidden text-slate-900"
        id="pricing"
      >
        <div className="container max-w-7xl mx-auto relative z-10 px-6">
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
                data.subheadline ||
                "Simple, transparent pricing. No hidden fees."
              }
              sectionId={id}
              isPreview={isPreview}
              className="text-lg md:text-xl text-slate-500 font-medium"
            />
          </div>

          {hasPlans && (
            <>
              {variant === "cards" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
                  {plans.map((plan: any, i: number) => (
                    <PricingCard key={i} plan={plan} />
                  ))}
                </div>
              )}

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
    </>
  );
}

CupertinoPricing.schema = schema;
