import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Send,
  CheckCircle2,
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/supabaseClient";
import { cn } from "@/lib/utils";
import { InlineEdit } from "../../components/dashboard/InlineEdit";

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

const LeadForm: React.FC<any> = ({
  data,
  actorId,
  portfolioId,
  id,
  isPreview,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [formState, setFormState] = useState<Record<string, string>>({});

  const fields = data.fields || [
    { id: "name", label: "Name", type: "text", required: true, width: "half" },
    {
      id: "email",
      label: "Email",
      type: "email",
      required: true,
      width: "half",
    },
    {
      id: "message",
      label: "Message",
      type: "textarea",
      required: true,
      width: "full",
    },
  ];

  const variant = data.variant || "centered"; // 'centered' | 'split' | 'minimal'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🚀 SAFE SHIELD: Don't submit real leads in the builder!
    if (isPreview) {
      alert("Form submission is simulated in the builder.");
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsSent(true);
      }, 800);
      return;
    }

    if (!actorId) {
      alert("Configuration Error: Owner ID missing.");
      return;
    }

    setIsLoading(true);

    const dbPayload: any = {
      actor_id: actorId,
      portfolio_id: portfolioId,
      source: "portfolio_form",
      name: formState["name"] || "Anonymous",
      email: formState["email"] || "no-email@provided.com",
      phone: formState["phone"] || null,
      subject: formState["subject"] || "New Portfolio Inquiry",
      message: formState["message"] || "",
      metadata: {},
    };

    fields.forEach((f: any) => {
      if (!["name", "email", "phone", "subject", "message"].includes(f.id)) {
        dbPayload.metadata[f.label] = formState[f.id];
      }
    });

    const { error } = await supabase.from("leads").insert(dbPayload);

    setIsLoading(false);

    if (error) {
      console.error("Lead Error:", error);
      alert("Failed to send message. Please try again.");
    } else {
      setIsSent(true);
    }
  };

  // --- SUCCESS STATE UX ---
  if (isSent) {
    return (
      <section className="py-32 px-6 bg-neutral-950 relative overflow-hidden flex items-center justify-center min-h-[60vh]">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-green-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-md w-full mx-auto text-center space-y-6 animate-in zoom-in-95 duration-500 relative z-10 bg-neutral-900/40 backdrop-blur-xl p-10 rounded-3xl border border-white/10 ring-1 ring-white/5">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <CheckCircle2
              size={40}
              className="animate-in fade-in zoom-in duration-700 delay-200"
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Message Sent!
            </h3>
            <p className="text-neutral-400 font-medium">
              Thank you! We have received your message and will get back to you
              shortly.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-4 rounded-full px-8 border-white/20 text-white hover:bg-white hover:text-black transition-all"
            onClick={() => {
              setIsSent(false);
              setFormState({});
            }}
          >
            Send Another Message
          </Button>
        </div>
      </section>
    );
  }

  // --- REUSABLE FORM JSX ---
  const formContentJsx = (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 animate-in fade-in duration-700"
    >
      <div className="flex flex-wrap gap-5">
        {fields.map((field: any, idx: number) => {
          const isHalf = field.width === "half";
          return (
            <div
              key={idx}
              className={cn(
                "space-y-2.5 flex-grow",
                isHalf
                  ? "basis-[calc(50%-1.25rem)] min-w-[240px]"
                  : "basis-full w-full"
              )}
            >
              <Label className="text-neutral-400 flex items-center gap-2 text-xs uppercase tracking-widest font-bold ml-1">
                {getFieldIcon(field.type)} {field.label}{" "}
                {field.required && <span className="text-primary">*</span>}
              </Label>

              {field.type === "textarea" ? (
                <Textarea
                  required={field.required && !isPreview}
                  readOnly={isPreview}
                  placeholder={field.placeholder}
                  className="bg-white/5 border-white/10 hover:border-white/20 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/50 text-white placeholder:text-neutral-600 transition-all min-h-[140px] resize-none p-4 leading-relaxed rounded-2xl text-base"
                  value={formState[field.id] || ""}
                  onChange={(e) =>
                    setFormState({ ...formState, [field.id]: e.target.value })
                  }
                />
              ) : (
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
                  className="bg-white/5 border-white/10 hover:border-white/20 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/50 text-white placeholder:text-neutral-600 transition-all h-14 rounded-2xl px-4 text-base"
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

      <div className="pt-6">
        <Button
          type={isPreview ? "button" : "submit"}
          disabled={isLoading}
          className="w-full h-16 text-lg font-bold rounded-2xl bg-primary text-black hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.1)] group"
        >
          {isLoading ? (
            <Loader2 className="animate-spin mr-2 w-5 h-5" />
          ) : (
            <Send className="mr-3 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          )}
          <InlineEdit
            tagName="span"
            text={data.buttonText || "Send Message"}
            sectionId={id}
            fieldKey="buttonText"
            isPreview={isPreview}
            className="tracking-wide"
          />
        </Button>
      </div>
    </form>
  );

  // --- VARIANT 1: CENTERED (Standard) ---
  if (variant === "centered") {
    return (
      <section
        className="py-24 md:py-32 px-6 md:px-12 bg-neutral-950 relative overflow-hidden"
        id="contact-form"
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-14 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <InlineEdit
              tagName="h2"
              className="text-4xl md:text-6xl font-black text-white tracking-tighter block"
              text={data.title || "Contact Us"}
              sectionId={id}
              fieldKey="title"
              isPreview={isPreview}
            />
            <InlineEdit
              tagName="p"
              className="text-lg md:text-xl text-neutral-400 block font-medium max-w-xl mx-auto"
              text={
                data.subheadline ||
                "Send us a message and we'll get back to you."
              }
              sectionId={id}
              fieldKey="subheadline"
              isPreview={isPreview}
            />
          </div>

          <div className="bg-neutral-900/40 border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 animate-in zoom-in-95 duration-700 delay-100">
            {formContentJsx}
          </div>
        </div>
      </section>
    );
  }

  // --- VARIANT 2: SPLIT SCREEN ---
  if (variant === "split") {
    return (
      <section
        className="bg-neutral-950 relative overflow-hidden flex flex-col lg:flex-row min-h-[800px]"
        id="contact-form"
      >
        {/* Left: Image / Content */}
        <div className="w-full lg:w-1/2 relative min-h-[400px] lg:min-h-full flex flex-col justify-end">
          {data.image ? (
            <img
              src={data.image}
              alt="Contact"
              className="absolute inset-0 w-full h-full object-cover filter brightness-75"
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center text-neutral-600 border-r border-white/5">
              <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
              <span className="text-sm font-bold uppercase tracking-widest opacity-40">
                No Cover Image
              </span>
            </div>
          )}
          {/* Editorial Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent pointer-events-none" />

          <div className="relative z-10 p-10 md:p-16 lg:p-20 pointer-events-none animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <InlineEdit
              tagName="h2"
              className="text-4xl md:text-5xl lg:text-7xl font-black text-white mb-6 block pointer-events-auto tracking-tighter leading-tight"
              text={data.title || "Get In Touch"}
              sectionId={id}
              fieldKey="title"
              isPreview={isPreview}
            />
            <div className="h-1 w-20 bg-primary mb-6" />
            <InlineEdit
              tagName="p"
              className="text-lg md:text-xl text-neutral-300 block pointer-events-auto font-medium max-w-md leading-relaxed"
              text={
                data.subheadline ||
                "We'd love to hear from you. Fill out the form and our team will be in touch shortly."
              }
              sectionId={id}
              fieldKey="subheadline"
              isPreview={isPreview}
            />
          </div>
        </div>

        {/* Right: Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-neutral-950 relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
          <div className="relative z-10 max-w-xl w-full mx-auto">
            {formContentJsx}
          </div>
        </div>
      </section>
    );
  }

  // --- VARIANT 3: MINIMAL (No Box) ---
  return (
    <section
      className="py-24 md:py-32 px-6 bg-neutral-950 relative overflow-hidden"
      id="contact-form"
    >
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

      <div className="max-w-3xl mx-auto space-y-16 relative z-10">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <InlineEdit
            tagName="h2"
            className="text-5xl md:text-7xl font-black text-white tracking-tighter block"
            text={data.title || "Contact Us"}
            sectionId={id}
            fieldKey="title"
            isPreview={isPreview}
          />
          <InlineEdit
            tagName="p"
            className="text-xl md:text-2xl text-neutral-400 border-l-4 border-primary pl-6 block font-medium py-2"
            text={
              data.subheadline ||
              "Send us a message and we'll get back to you as soon as possible."
            }
            sectionId={id}
            fieldKey="subheadline"
            isPreview={isPreview}
          />
        </div>
        <div className="pt-4">{formContentJsx}</div>
      </div>
    </section>
  );
};

export default LeadForm;
