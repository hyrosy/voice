import { useState } from "react";
import { supabase } from "@/supabaseClient";

export function usePricingForm({
  actorId,
  portfolioId,
  isPreview,
}: {
  actorId?: string;
  portfolioId?: string;
  isPreview?: boolean;
}) {
  const [activePlan, setActivePlan] = useState<any | null>(null);
  const [formTemplate, setFormTemplate] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const handlePlanAction = async (plan: any, e: React.MouseEvent) => {
    if (isPreview) {
      e.preventDefault();
      return;
    }

    if (plan.actionType === "form" && plan.formId) {
      e.preventDefault();
      setActivePlan(plan);
      setIsModalOpen(true);
      setIsLoadingForm(true);
      setIsSuccess(false);
      setFormValues({});

      // Fetch the specific form template from DB
      const { data: formData } = await supabase
        .from("forms")
        .select("*")
        .eq("id", plan.formId)
        .single();

      if (formData) {
        setFormTemplate(formData);
      }
      setIsLoadingForm(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actorId || !activePlan) return;

    setIsSubmitting(true);

    const dbPayload: any = {
      actor_id: actorId,
      portfolio_id: portfolioId,
      source: "pricing_form",
      name: formValues["name"] || "Anonymous",
      email: formValues["email"] || "no-email@provided.com",
      phone: formValues["phone"] || null,
      subject: `Inquiry for ${activePlan.name} Plan`,
      message: formValues["message"] || "",
      metadata: {
        "Plan Name": activePlan.name,
        "Plan Price": activePlan.price,
      },
    };

    // Append custom fields to metadata
    if (formTemplate?.fields) {
      formTemplate.fields.forEach((f: any) => {
        if (!["name", "email", "phone", "subject", "message"].includes(f.id)) {
          dbPayload.metadata[f.label] = formValues[f.id];
        }
      });
    }

    const { error } = await supabase.from("leads").insert(dbPayload);
    setIsSubmitting(false);

    if (error) {
      console.error("Lead Error:", error);
      alert("Failed to send message. Please try again.");
    } else {
      setIsSuccess(true);
    }
  };

  const parseOptions = (optString?: string) => {
    if (!optString) return [];
    return optString
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  return {
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
  };
}
