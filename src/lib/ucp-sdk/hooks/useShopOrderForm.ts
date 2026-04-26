import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { trackEvent } from "../../analytics";

export function useShopOrderForm({
  actorId,
  portfolioId,
  isPreview,
  initialProduct = null,
}: {
  actorId?: string;
  portfolioId?: string;
  isPreview?: boolean;
  initialProduct?: any;
}) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(
    initialProduct
  );
  const [step, setStep] = useState<"details" | "form" | "success">("details");
  const [expandedModalFaq, setExpandedModalFaq] = useState<number | null>(null);
  const [formTemplate, setFormTemplate] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>(
    {}
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const parseOptions = (optStringOrArray?: string | any[]) => {
    if (!optStringOrArray) return [];
    if (Array.isArray(optStringOrArray)) {
      // If it's already an array of options, extract the labels
      return optStringOrArray
        .map((opt) => (typeof opt === "string" ? opt : opt.label))
        .filter(Boolean);
    }
    // If it's a string, split it
    if (typeof optStringOrArray === "string") {
      return optStringOrArray
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  const calculateTotalPrice = (
    basePrice: string,
    variants: Record<string, any>,
    qty: number
  ) => {
    const cleanBasePrice = parseFloat(
      (basePrice || "0").toString().replace(/[^0-9.]/g, "")
    );
    let total = isNaN(cleanBasePrice) ? 0 : cleanBasePrice;

    Object.values(variants).forEach((option) => {
      if (option && option.price) {
        const optionPrice = parseFloat(
          option.price.toString().replace(/[^0-9.]/g, "")
        );
        if (!isNaN(optionPrice)) total += optionPrice;
      }
    });

    return (total * qty).toFixed(2);
  };

  // Triggered when a user clicks a Product Card in Grid/Carousel
  const openProductModal = (product: any) => {
    if (product.actionType === "link") {
      if (actorId)
        trackEvent(actorId, "shop_click", {
          product_name: product.title,
          portfolio_id: portfolioId,
        });
      if (!isPreview) window.open(product.checkoutUrl || "#", "_blank");
      return;
    }

    setSelectedProduct(product);
    setIsModalOpen(true);
    setStep("details");
    setQuantity(1);
    setSelectedVariants({});
    setFormValues({});
    setIsSuccess(false);
    setExpandedModalFaq(null);
    setActiveImageIdx(0);
  };

  // Triggered when a user clicks "Buy Now" inside the Modal or Spotlight view
  const proceedToCheckout = async (product: any) => {
    if (isPreview) {
      alert("Checkout is disabled in Preview Mode.");
      return;
    }

    if (product.actionType === "link") {
      if (actorId)
        trackEvent(actorId, "shop_click", {
          product_name: product.title,
          portfolio_id: portfolioId,
        });
      window.open(product.checkoutUrl || "#", "_blank");
      return;
    }

    if (product.variants && product.variants.length > 0) {
      const missing = product.variants.find(
        (v: any) => !selectedVariants[v.name]
      );
      if (missing) return alert(`Please select a ${missing.name}`);
    }

    setStep("form");
    setIsLoadingForm(true);

    if (product.actionType === "form_order" && product.formId) {
      const { data: formData } = await supabase
        .from("forms")
        .select("*")
        .eq("id", product.formId)
        .single();
      if (formData) setFormTemplate(formData);
    } else {
      setFormTemplate(null);
    }

    setIsLoadingForm(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actorId || !selectedProduct) return;

    if (selectedProduct.variants && selectedProduct.variants.length > 0) {
      const missing = selectedProduct.variants.find(
        (v: any) => !selectedVariants[v.name]
      );
      if (missing) return alert(`Please select a ${missing.name}`);
    }

    const actionType = selectedProduct.actionType || "whatsapp";

    if (actionType === "whatsapp") {
      if (actorId)
        trackEvent(actorId, "whatsapp_click", {
          product_name: selectedProduct.title,
          portfolio_id: portfolioId,
        });
      const variantText = Object.entries(selectedVariants)
        .map(([key, val]) => `${key}: ${val.label || val}`)
        .join(", ");
      const message = `*NEW ORDER* 🛍️\n------------------\n*Product:* ${
        selectedProduct.title
      }\n*Price:* ${selectedProduct.price}\n*Qty:* ${quantity}\n${
        variantText ? `*Options:* ${variantText}` : ""
      }\n\n*CUSTOMER DETAILS* 👤\n*Name:* ${
        formValues["name"] || "Not Provided"
      }\n*Phone:* ${
        formValues["phone"] || "Not Provided"
      }\n------------------\nPlease confirm my order!`;
      const number = selectedProduct.whatsappNumber
        ? selectedProduct.whatsappNumber.replace(/[^0-9]/g, "")
        : "";
      window.open(
        `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
      return;
    }

    if (actionType === "form_order") {
      setIsSubmitting(true);
      const finalPrice = calculateTotalPrice(
        selectedProduct.price,
        selectedVariants,
        quantity
      );

      const getFieldVal = (keywords: string[]) => {
        const key = Object.keys(formValues).find((k) =>
          keywords.some((keyword) => k.toLowerCase().includes(keyword))
        );
        return key ? formValues[key] : "";
      };

      const dbPayload = {
        actor_id: actorId,
        portfolio_id: portfolioId,
        customer_name:
          getFieldVal(["name", "first", "last"]) || "Anonymous Buyer",
        customer_phone: getFieldVal(["phone", "tel", "mobile"]) || "No Phone",
        customer_address:
          getFieldVal(["address", "shipping", "street", "city", "zip"]) ||
          "No Address Provided",
        product_name: selectedProduct.title,
        product_price: `$${finalPrice}`,
        quantity: quantity,
        variants: selectedVariants,
        status: "pending",
        notes: Object.entries(formValues)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n"),
      };

      const { error } = await supabase.from("pro_orders").insert(dbPayload);
      setIsSubmitting(false);

      if (error) {
        console.error("Order Error:", error);
        alert("Failed to submit order. Please try again.");
      } else {
        setIsSuccess(true);
        setStep("success");
      }
    }
  };

  return {
    selectedProduct,
    setSelectedProduct,
    step,
    setStep,
    formTemplate,
    setFormTemplate,
    isModalOpen,
    setIsModalOpen,
    isLoadingForm,
    setIsLoadingForm,
    isSubmitting,
    isSuccess,
    setIsSuccess,
    formValues,
    setFormValues,
    selectedVariants,
    setSelectedVariants,
    quantity,
    setQuantity,
    expandedModalFaq,
    setExpandedModalFaq,
    activeImageIdx,
    setActiveImageIdx,
    parseOptions,
    calculateTotalPrice,
    openProductModal,
    proceedToCheckout,
    handleFormSubmit,
  };
}
