// src/lib/ucp-sdk/hooks/useLeadForm.ts
import { useState } from "react";
import { supabase } from "@/supabaseClient";

export function useLeadForm({
  data,
  actorId,
  portfolioId,
  isPreview,
}: {
  data: any;
  actorId?: string;
  portfolioId?: string;
  isPreview?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [formState, setFormState] = useState<Record<string, string>>({});

  const fields = data?.fields || [
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

  const parseOptions = (optString?: string) => {
    if (!optString) return [];
    return optString
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

  const resetForm = () => {
    setIsSent(false);
    setFormState({});
  };

  return {
    fields,
    formState,
    setFormState,
    isLoading,
    isSent,
    handleSubmit,
    parseOptions,
    resetForm,
  };
}
