import React from "react";
import { cn } from "@/lib/utils";
import {
  Mail,
  Phone,
  MessageCircle,
  Linkedin,
  Instagram,
  Twitter,
  Globe,
  ArrowRight,
} from "lucide-react";
import { UCP } from "@ucp/sdk"; // 🚀 The SDK Magic

// 1. DEVELOPER SCHEMA: Apple-inspired controls
export const schema = [
  {
    id: "glassmorphism",
    type: "toggle",
    label: "Frosted Glass Cards",
    defaultValue: true,
  },
  {
    id: "accentColor",
    type: "select",
    label: "Accent Color",
    options: ["blue", "slate", "indigo"],
    defaultValue: "blue",
  },
];

export default function CupertinoContact({
  data,
  settings = {},
  id,
  isPreview,
}: any) {
  const variant = data.variant || "minimal";

  // 🚀 FIX: Forced text-white for perfect contrast on dark buttons!
  const accentClass =
    settings.accentColor === "blue"
      ? "text-white bg-blue-500 hover:bg-blue-600"
      : settings.accentColor === "indigo"
      ? "text-white bg-indigo-500 hover:bg-indigo-600"
      : "text-white bg-slate-900 hover:bg-slate-800";

  const textAccent =
    settings.accentColor === "blue"
      ? "text-blue-500"
      : settings.accentColor === "indigo"
      ? "text-indigo-500"
      : "text-slate-900";

  // --- SUB-COMPONENT: SOCIAL ICONS ---
  const Socials = () => (
    <div className="flex flex-wrap gap-3">
      {data.linkedin && (
        <a
          href={data.linkedin}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => isPreview && e.preventDefault()}
          className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Linkedin size={20} />
        </a>
      )}
      {data.instagram && (
        <a
          href={data.instagram}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => isPreview && e.preventDefault()}
          className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Instagram size={20} />
        </a>
      )}
      {data.twitter && (
        <a
          href={data.twitter}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => isPreview && e.preventDefault()}
          className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Twitter size={20} />
        </a>
      )}
      {data.website && (
        <a
          href={data.website}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => isPreview && e.preventDefault()}
          className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Globe size={20} />
        </a>
      )}
    </div>
  );

  // --- SUB-COMPONENT: BUTTONS ---
  const Actions = ({ align = "center" }: { align?: "center" | "start" }) => (
    <div
      className={cn(
        "flex flex-wrap gap-4",
        align === "center" ? "justify-center" : "justify-start"
      )}
    >
      <a
        href={`mailto:${data.email}`}
        onClick={(e) => isPreview && e.preventDefault()}
        className={cn(
          "inline-flex items-center justify-center h-12 px-8 rounded-full font-semibold transition-all hover:scale-105 shadow-md",
          accentClass
        )}
      >
        {/* 🚀 FIX: Added fallback string */}
        <UCP.Text
          as="span"
          field="ctaText"
          value={data.ctaText || "Send Email"}
          sectionId={id}
          isPreview={isPreview}
        />
        <ArrowRight className="ml-2 w-4 h-4" />
      </a>

      {data.whatsapp && (
        <a
          href={`https://wa.me/${UCP.utils.cleanPhoneNumber(data.whatsapp)}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => isPreview && e.preventDefault()}
          className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-green-50 text-green-600 font-semibold hover:bg-green-100 transition-all"
        >
          <MessageCircle className="mr-2 w-5 h-5" /> WhatsApp
        </a>
      )}

      {data.phone && (
        <a
          href={`tel:${UCP.utils.cleanPhoneNumber(data.phone)}`}
          onClick={(e) => isPreview && e.preventDefault()}
          className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all"
        >
          <Phone className="mr-2 w-5 h-5" /> Call
        </a>
      )}
    </div>
  );

  return (
    <section className="relative py-24 md:py-32 bg-white overflow-hidden text-slate-900">
      {/* VARIANT 1: MINIMAL */}
      {variant === "minimal" && (
        <div className="container mx-auto px-6 max-w-4xl text-center space-y-10">
          <div className="space-y-4">
            {/* 🚀 FIX: Added fallback strings */}
            <UCP.Text
              as="h2"
              field="title"
              value={data.title || "Let's Work Together"}
              sectionId={id}
              isPreview={isPreview}
              className="text-5xl md:text-7xl font-[800] tracking-tighter"
            />
            <UCP.Text
              as="p"
              field="subheadline"
              value={
                data.subheadline || "Reach out to discuss your next project."
              }
              sectionId={id}
              isPreview={isPreview}
              className="text-xl text-slate-500 font-medium max-w-2xl mx-auto"
            />
          </div>
          <Actions align="center" />
          <div className="pt-8 flex justify-center">
            <Socials />
          </div>
        </div>
      )}

      {/* VARIANT 2: SPLIT */}
      {variant === "split" && (
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-100 order-2 lg:order-1">
              {data.image ? (
                <img
                  src={data.image}
                  alt="Contact"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Mail className="w-24 h-24" />
                </div>
              )}
            </div>
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <UCP.Text
                  as="h2"
                  field="title"
                  value={data.title || "Get In Touch"}
                  sectionId={id}
                  isPreview={isPreview}
                  className={cn(
                    "text-5xl lg:text-6xl font-[800] tracking-tighter",
                    textAccent
                  )}
                />
                <UCP.Text
                  as="p"
                  field="subheadline"
                  value={
                    data.subheadline ||
                    "Reach out to discuss your next project."
                  }
                  sectionId={id}
                  isPreview={isPreview}
                  className="text-xl text-slate-500 font-medium"
                />
              </div>
              <Actions align="start" />
              <div className="pt-6">
                <Socials />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VARIANT 3: CARD */}
      {variant === "card" && (
        <div className="relative w-full min-h-[60vh] flex items-center justify-center py-12 px-6">
          {data.image && (
            <div className="absolute inset-0 z-0">
              <img
                src={data.image}
                className="w-full h-full object-cover opacity-60 blur-2xl saturate-150"
                alt="bg"
              />
            </div>
          )}
          <div
            className={cn(
              "w-full max-w-3xl relative z-10 rounded-[3rem] p-10 md:p-16 text-center space-y-8 shadow-2xl",
              settings.glassmorphism
                ? "bg-white/70 backdrop-blur-2xl border border-white"
                : "bg-white"
            )}
          >
            <div className="space-y-4">
              <UCP.Text
                as="h2"
                field="title"
                value={data.title || "Contact Me"}
                sectionId={id}
                isPreview={isPreview}
                className="text-4xl md:text-5xl font-[800] tracking-tighter"
              />
              <UCP.Text
                as="p"
                field="subheadline"
                value={
                  data.subheadline || "Reach out to discuss your next project."
                }
                sectionId={id}
                isPreview={isPreview}
                className="text-lg text-slate-600 font-medium max-w-xl mx-auto"
              />
            </div>
            <div className="flex justify-center">
              <Actions align="center" />
            </div>
            <div className="pt-8 border-t border-slate-200/50 flex flex-col items-center gap-4 mt-8">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                Connect Socially
              </span>
              <Socials />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

CupertinoContact.schema = schema;
