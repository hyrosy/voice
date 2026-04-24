import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  CheckCircle2,
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Image as ImageIcon,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk"; // 🚀 The Platform SDK

// ==========================================
// 1. THEME CUSTOM SCHEMA
// ==========================================
export const schema = [
  {
    id: "inputStyle",
    label: "Input Field Style",
    type: "select",
    options: ["glass", "solid", "minimal"],
    defaultValue: "glass",
  },
  {
    id: "cardRounding",
    label: "Card Rounding",
    type: "select",
    options: ["xl", "2xl", "3xl", "bento"],
    defaultValue: "bento",
  },
  {
    id: "glassOpacity",
    label: "Glass Background Opacity (%)",
    type: "slider",
    min: 0,
    max: 20,
    step: 1,
    defaultValue: 5,
  },
  {
    id: "blurIntensity",
    label: "Glass Blur Intensity (px)",
    type: "slider",
    min: 0,
    max: 60,
    step: 2,
    defaultValue: 24,
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
export default function CupertinoLeadForm({
  data,
  settings = {},
  actorId,
  portfolioId,
  id,
  isPreview,
}: any) {
  // --- 🚀 PLATFORM SDK (The Heavy Lifting) ---
  const {
    fields,
    formState,
    setFormState,
    isLoading,
    isSent,
    handleSubmit,
    parseOptions,
    resetForm,
  } = UCP.useLeadForm({ data, actorId, portfolioId, isPreview });

  const variant = data.variant || "centered";

  // --- THEME LOCAL STATE & SETTINGS ---
  const blurAmount = settings.blurIntensity ?? 24;
  const glassOpacity = settings.glassOpacity ?? 5;
  const cardRounding =
    settings.cardRounding === "xl"
      ? "rounded-xl"
      : settings.cardRounding === "2xl"
      ? "rounded-2xl"
      : settings.cardRounding === "3xl"
      ? "rounded-3xl"
      : "rounded-[2.5rem]";

  const inputStyle = settings.inputStyle || "glass";
  const inputClass = cn(
    "transition-all h-12 rounded-xl px-4 text-sm w-full outline-none",
    inputStyle === "solid"
      ? "bg-neutral-900 border-white/5 hover:border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-white"
      : inputStyle === "minimal"
      ? "bg-transparent border-0 border-b-2 border-white/10 hover:border-white/30 focus:border-blue-500 rounded-none px-0 text-white"
      : "bg-black/20 border border-white/10 hover:border-white/20 focus:bg-black/40 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-white"
  );

  // --- SUCCESS STATE ---
  if (isSent) {
    return (
      <section className="py-24 px-4 md:px-8 flex items-center justify-center min-h-[50vh]">
        <div
          className={cn(
            "max-w-sm w-full border border-white/10 p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden",
            cardRounding
          )}
          style={{
            backgroundColor: `rgba(255, 255, 255, ${glassOpacity / 100})`,
            backdropFilter: `blur(${blurAmount}px)`,
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-blue-500 blur-[10px] rounded-full"></div>

          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(59,130,246,0.3)]">
            <CheckCircle2
              size={40}
              className="text-white animate-in fade-in zoom-in duration-700 delay-150"
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {data.successTitle || "Message Sent"}
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              {data.successMessage ||
                "Thank you. We will get back to you shortly."}
            </p>
          </div>
          <Button
            variant="secondary"
            className="mt-4 rounded-full w-full h-12 bg-white/10 text-white hover:bg-white/20 border-0 transition-all"
            onClick={resetForm}
          >
            Send Another Message
          </Button>
        </div>
      </section>
    );
  }

  // --- REUSABLE CUPERTINO FORM JSX ---
  const formContentJsx = (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 animate-in fade-in duration-700"
    >
      <div className="flex flex-wrap gap-4">
        {fields.map((field: any, idx: number) => {
          const isHalf = field.width === "half";
          const fieldOptions = parseOptions(field.options);

          return (
            <div
              key={idx}
              className={cn(
                "space-y-2 flex-grow",
                isHalf
                  ? "basis-[calc(50%-1rem)] min-w-[200px]"
                  : "basis-full w-full"
              )}
            >
              <Label className="text-neutral-400 flex items-center gap-1.5 text-xs font-semibold pl-1">
                {field.label}{" "}
                {field.required && <span className="text-blue-500">*</span>}
              </Label>

              {/* 🚀 TEXTAREA */}
              {field.type === "textarea" ? (
                <Textarea
                  required={field.required && !isPreview}
                  readOnly={isPreview}
                  placeholder={field.placeholder}
                  className={cn(inputClass, "min-h-[120px] resize-none p-4")}
                  value={formState[field.id] || ""}
                  onChange={(e) =>
                    setFormState({ ...formState, [field.id]: e.target.value })
                  }
                />
              ) : /* 🚀 SELECT */
              field.type === "select" ? (
                <div className="relative">
                  <select
                    required={field.required && !isPreview}
                    disabled={isPreview}
                    className={cn(inputClass, "appearance-none")}
                    value={formState[field.id] || ""}
                    onChange={(e) =>
                      setFormState({ ...formState, [field.id]: e.target.value })
                    }
                  >
                    <option value="" disabled className="text-neutral-900">
                      Select...
                    </option>
                    {/* ✅ TS FIX: Explicit types for opt and i */}
                    {fieldOptions.map((opt: string, i: number) => (
                      <option key={i} value={opt} className="text-neutral-900">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
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
              ) : /* 🚀 RADIO */
              field.type === "radio" ? (
                <div className="flex flex-col gap-2 pt-1">
                  {/* ✅ TS FIX: Explicit types for opt and i */}
                  {fieldOptions.map((opt: string, i: number) => (
                    <label
                      key={i}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors group",
                        inputStyle === "minimal"
                          ? "border-transparent bg-transparent border-b border-white/10 rounded-none"
                          : "border-white/10 bg-black/10 hover:bg-white/5",
                        "has-[:checked]:bg-blue-500/10 has-[:checked]:border-blue-500/50"
                      )}
                    >
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-white/20 group-hover:border-white/40 group-has-[:checked]:border-blue-500 transition-colors">
                        <input
                          type="radio"
                          name={field.id}
                          value={opt}
                          required={field.required && !isPreview}
                          disabled={isPreview}
                          className="peer sr-only"
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              [field.id]: e.target.value,
                            })
                          }
                        />
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 opacity-0 peer-checked:opacity-100 transition-opacity scale-50 peer-checked:scale-100" />
                      </div>
                      <span className="text-neutral-300 group-has-[:checked]:text-white transition-colors text-sm font-medium">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                /* 🚀 STANDARD INPUTS */
                <Input
                  required={field.required && !isPreview}
                  readOnly={isPreview}
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
                  className={cn(
                    inputClass,
                    field.type === "date" &&
                      "[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-50"
                  )}
                  value={formState[field.id] || ""}
                  onChange={(e) =>
                    setFormState({ ...formState, [field.id]: e.target.value })
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-4">
        <Button
          type={isPreview ? "button" : "submit"}
          disabled={isLoading}
          className="w-full h-12 text-sm font-semibold rounded-full bg-blue-500 text-white hover:bg-blue-600 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] group"
        >
          {isLoading ? (
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
          ) : (
            <ArrowRight className="w-4 h-4 mr-2 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
          )}
          <UCP.Text
            as="span"
            value={data.buttonText || "Send Message"}
            sectionId={id}
            field="buttonText"
            isPreview={isPreview}
          />
        </Button>
      </div>
    </form>
  );

  if (variant === "centered") {
    return (
      <section className="py-24 px-4 md:px-8" id="contact-form">
        <div
          className={cn(
            "max-w-2xl mx-auto border border-white/10 p-8 md:p-12 shadow-2xl relative overflow-hidden",
            cardRounding
          )}
          style={{
            backgroundColor: `rgba(255, 255, 255, ${glassOpacity / 100})`,
            backdropFilter: `blur(${blurAmount}px)`,
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="text-center mb-10 space-y-3 relative z-10">
            <UCP.Text
              as="h2"
              className="text-3xl md:text-5xl font-semibold text-white tracking-tight block"
              value={data.title || "Contact Us"}
              sectionId={id}
              field="title"
              isPreview={isPreview}
            />
            <UCP.Text
              as="p"
              className="text-neutral-400 text-sm md:text-base max-w-md mx-auto block"
              value={
                data.subheadline ||
                "Send us a message and we'll get back to you."
              }
              sectionId={id}
              field="subheadline"
              isPreview={isPreview}
            />
          </div>

          <div className="relative z-10">{formContentJsx}</div>
        </div>
      </section>
    );
  }

  if (variant === "split") {
    return (
      <section
        className="py-20 px-4 md:px-8 max-w-7xl mx-auto"
        id="contact-form"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div
            className={cn(
              "lg:col-span-5 relative overflow-hidden border border-white/10 flex flex-col justify-end min-h-[400px] lg:min-h-full group",
              cardRounding
            )}
            style={{
              backgroundColor: `rgba(255, 255, 255, ${glassOpacity / 100})`,
            }}
          >
            {data.image ? (
              <img
                src={data.image}
                alt="Contact"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 mix-blend-overlay"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
                <ImageIcon className="w-12 h-12 opacity-20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

            <div className="relative z-10 p-8 md:p-10 pointer-events-none">
              <UCP.Text
                as="h2"
                className="text-4xl md:text-5xl font-semibold text-white mb-4 block pointer-events-auto tracking-tight"
                value={data.title || "Get In Touch"}
                sectionId={id}
                field="title"
                isPreview={isPreview}
              />
              <UCP.Text
                as="p"
                className="text-neutral-300 text-sm block pointer-events-auto leading-relaxed"
                value={data.subheadline || "We'd love to hear from you."}
                sectionId={id}
                field="subheadline"
                isPreview={isPreview}
              />
            </div>
          </div>

          <div
            className={cn(
              "lg:col-span-7 border border-white/10 p-8 md:p-12 shadow-xl",
              cardRounding
            )}
            style={{
              backgroundColor: `rgba(255, 255, 255, ${glassOpacity / 100})`,
              backdropFilter: `blur(${blurAmount}px)`,
            }}
          >
            {formContentJsx}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-4 md:px-8 max-w-3xl mx-auto" id="contact-form">
      <div className="space-y-12">
        <div className="space-y-4 text-center">
          <UCP.Text
            as="h2"
            className="text-4xl md:text-6xl font-semibold text-white tracking-tight block"
            value={data.title || "Contact Us"}
            sectionId={id}
            field="title"
            isPreview={isPreview}
          />
          <UCP.Text
            as="p"
            className="text-neutral-400 text-lg block"
            value={data.subheadline || "Send us a message."}
            sectionId={id}
            field="subheadline"
            isPreview={isPreview}
          />
        </div>
        <div className="px-2">{formContentJsx}</div>
      </div>
    </section>
  );
}

CupertinoLeadForm.schema = schema;
