import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { BlockProps } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart,
  ChevronRight,
  ExternalLink,
  Loader2,
  X,
  CheckCircle2,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  User,
  ChevronDown,
  Minus,
  Plus,
  ChevronLeft,
  Store,
  ArrowRight,
  MessageCircle,
  Tag,
  HelpCircle,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk"; // 🚀 SDK Magic

// ==========================================
// 1. TYPES & PROP EXTENSION
// ==========================================
export interface ShopProps extends BlockProps {
  portfolioId?: string;
  actorId?: string;
}

// ==========================================
// 2. THEME CUSTOM SCHEMA
// ==========================================
export const schema = [
  {
    id: "variant",
    label: "Layout Style",
    type: "select",
    options: ["grid", "carousel", "spotlight"],
    defaultValue: "grid",
  },
];

export const defaultProps = {
  title: "Store",
  subheadline: "Shop the latest products and services.",
  variant: "grid",
};

// --- HELPERS ---
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
// 3. SUB-COMPONENT: INLINE SPOTLIGHT CHECKOUT
// ==========================================
const SpotlightCheckout = ({
  product,
  actorId,
  portfolioId,
  isPreview,
}: any) => {
  // 🚀 Spotlight gets its OWN isolated SDK instance!
  const checkout = UCP.useShopOrderForm({
    actorId,
    portfolioId,
    isPreview,
    initialProduct: product,
  });
  const { step, setStep, activeImageIdx, setActiveImageIdx } = checkout;
  const nextImage = () =>
    setActiveImageIdx((prev: number) => (prev + 1) % images.length);
  const prevImage = () =>
    setActiveImageIdx(
      (prev: number) => (prev - 1 + images.length) % images.length
    );
  const images = product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : [];
  const actionType = product.actionType || "whatsapp";

  if (step === "success") {
    return (
      <div className="bg-[#1c1c1e] rounded-[2rem] overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300 shadow-2xl">
        <div className="w-20 h-20 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mb-6 ring-1 ring-blue-500/50">
          <CheckCircle2 size={40} className="animate-in zoom-in duration-500" />
        </div>
        <h3 className="text-3xl font-bold text-white mb-2">
          {checkout.formTemplate?.success_title || "Order Received!"}
        </h3>
        <p className="text-neutral-400 max-w-md mx-auto mb-8">
          {checkout.formTemplate?.success_message ||
            `Thank you. We have received your order for ${product.title}.`}
        </p>
        <Button
          onClick={() => setStep("details")}
          className="bg-white text-black hover:bg-neutral-200 h-12 px-8 rounded-full font-bold"
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#1c1c1e] rounded-[2.5rem] overflow-hidden md:grid md:grid-cols-2 min-h-[600px] shadow-2xl">
      {/* LEFT: IMAGE GALLERY */}
      <div className="bg-black relative flex flex-col h-[400px] md:h-auto group/gallery">
        <div className="flex-grow relative overflow-hidden">
          {images.length > 0 ? (
            <>
              <img
                src={images[activeImageIdx]}
                alt={product.title}
                className="w-full h-full object-cover absolute inset-0 transition-all duration-500"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveImageIdx(
                        (prev) => (prev - 1 + images.length) % images.length
                      )
                    }
                    className="absolute left-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() =>
                      setActiveImageIdx((prev) => (prev + 1) % images.length)
                    }
                    className="absolute right-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-600">
              <ShoppingCart size={64} />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10 px-4">
            {images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={cn(
                  "w-12 h-12 rounded-xl border-2 overflow-hidden transition-all shadow-sm shrink-0",
                  activeImageIdx === idx
                    ? "border-blue-500 scale-110"
                    : "border-white/30 opacity-60 hover:opacity-100"
                )}
              >
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: DETAILS OR FORM */}
      <div className="p-8 md:p-12 flex flex-col justify-center h-full relative">
        {step === "details" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              {product.salePrice && (
                <div className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest w-max mb-3">
                  On Sale
                </div>
              )}
              <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
                {product.title}
              </h3>
              <div className="flex items-end gap-3 mt-3">
                {product.salePrice ? (
                  <>
                    <span className="text-3xl text-blue-400 font-bold font-mono">
                      {product.salePrice}
                    </span>
                    <span className="text-lg text-neutral-500 line-through mb-1 font-mono">
                      {product.price}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl text-white font-bold font-mono">
                    {product.price}
                  </span>
                )}
              </div>
            </div>

            <p className="text-lg text-neutral-300 leading-relaxed">
              {product.description}
            </p>

            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.variants.map((v: any, i: number) => {
                    const optionsArray = checkout.parseOptions(v.options);
                    return (
                      <div key={i} className="space-y-1.5">
                        <Label className="text-xs text-neutral-400 font-bold uppercase tracking-wider ml-1">
                          {v.name}
                        </Label>
                        <select
                          required
                          className="w-full bg-[#2c2c2e] border-none text-white h-12 rounded-xl px-4 text-sm appearance-none outline-none focus:ring-2 focus:ring-blue-500"
                          value={checkout.selectedVariants[v.name]?.label || ""}
                          onChange={(e) => {
                            const opt = optionsArray.find(
                              (o: any) => o.label === e.target.value
                            );
                            checkout.setSelectedVariants({
                              ...checkout.selectedVariants,
                              [v.name]: opt,
                            });
                          }}
                        >
                          <option value="" disabled>
                            Select {v.name}...
                          </option>
                          {optionsArray.map((opt: any, optIdx: number) => (
                            <option key={optIdx} value={opt.label}>
                              {opt.label} {opt.price && `(+$${opt.price})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {product.faqs && product.faqs.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-white/5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-2">
                  <HelpCircle size={14} /> Product Details
                </h4>
                <div className="bg-[#2c2c2e] rounded-2xl overflow-hidden divide-y divide-white/5">
                  {product.faqs.map((faq: any, i: number) => (
                    <div key={i}>
                      <button
                        type="button"
                        className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-medium text-white/90 hover:bg-white/5 transition-colors"
                        onClick={() =>
                          checkout.setExpandedModalFaq(
                            checkout.expandedModalFaq === i ? null : i
                          )
                        }
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          size={16}
                          className={cn(
                            "transition-transform text-neutral-400",
                            checkout.expandedModalFaq === i && "rotate-180"
                          )}
                        />
                      </button>
                      {checkout.expandedModalFaq === i && (
                        <div className="px-5 pb-4 text-sm text-neutral-400 leading-relaxed animate-in slide-in-from-top-1 fade-in">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 flex flex-col sm:flex-row gap-4 border-t border-white/5">
              {actionType !== "link" && (
                <div className="flex items-center gap-4 bg-[#2c2c2e] rounded-full p-1 w-max shrink-0">
                  <button
                    type="button"
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                    disabled={checkout.quantity <= 1}
                    onClick={() =>
                      checkout.setQuantity((q: number) => Math.max(1, q - 1))
                    }
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-semibold w-4 text-center text-white">
                    {checkout.quantity}
                  </span>
                  <button
                    type="button"
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                    onClick={() => checkout.setQuantity((q: number) => q + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
              <Button
                size="lg"
                className="flex-grow h-14 text-base rounded-full bg-blue-500 text-white hover:bg-blue-600 font-semibold"
                onClick={() => checkout.proceedToCheckout(product)}
              >
                {product.buttonText ||
                  (actionType === "link" ? "Buy Now" : "Order Now")}
                {actionType === "link" ? (
                  <ExternalLink className="ml-2 w-4 h-4" />
                ) : (
                  <ArrowRight className="ml-2 w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "form" && (
          <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 -ml-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("details")}
                className="text-neutral-400 hover:text-white rounded-full"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </div>

            {checkout.isLoadingForm ? (
              <div className="flex-grow flex flex-col items-center justify-center text-blue-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-sm text-neutral-400 font-medium">
                  Loading form...
                </p>
              </div>
            ) : (
              <div className="flex-grow flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {checkout.formTemplate?.title || "Complete Order"}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    {checkout.formTemplate?.subheadline ||
                      "Enter your details to finalize the purchase."}
                  </p>
                </div>

                <form
                  onSubmit={checkout.handleFormSubmit}
                  className="space-y-6 flex-grow flex flex-col"
                >
                  {checkout.formTemplate?.fields ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {checkout.formTemplate.fields.map(
                        (field: any, idx: number) => {
                          const isHalf = field.width === "half";
                          const fieldOptions = checkout.parseOptions(
                            field.options
                          );
                          return (
                            <div
                              key={idx}
                              className={cn(
                                "space-y-1.5",
                                isHalf
                                  ? "col-span-1"
                                  : "col-span-1 sm:col-span-2"
                              )}
                            >
                              <Label className="text-neutral-400 flex items-center gap-2 text-xs ml-1">
                                {getFieldIcon(field.type)} {field.label}{" "}
                                {field.required && (
                                  <span className="text-red-400">*</span>
                                )}
                              </Label>
                              {field.type === "textarea" ? (
                                <Textarea
                                  required={field.required}
                                  placeholder={field.placeholder}
                                  className="bg-[#2c2c2e] border-none text-white min-h-[100px] resize-none rounded-xl p-4 focus-visible:ring-2 focus-visible:ring-blue-500"
                                  value={checkout.formValues[field.id] || ""}
                                  onChange={(e) =>
                                    checkout.setFormValues({
                                      ...checkout.formValues,
                                      [field.id]: e.target.value,
                                    })
                                  }
                                />
                              ) : field.type === "select" ? (
                                <select
                                  required={field.required}
                                  className="w-full bg-[#2c2c2e] border-none text-white h-12 rounded-xl px-4 text-sm appearance-none outline-none focus:ring-2 focus:ring-blue-500"
                                  value={checkout.formValues[field.id] || ""}
                                  onChange={(e) =>
                                    checkout.setFormValues({
                                      ...checkout.formValues,
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
                              ) : field.type === "radio" ? (
                                <div className="flex flex-col gap-2 pt-1">
                                  {fieldOptions.map(
                                    (opt: string, i: number) => (
                                      <label
                                        key={i}
                                        className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] transition-colors has-[:checked]:bg-blue-500/10 has-[:checked]:ring-1 has-[:checked]:ring-blue-500"
                                      >
                                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-white/20 group-hover:border-blue-500 bg-black/20">
                                          <input
                                            type="radio"
                                            name={field.id}
                                            value={opt}
                                            required={field.required}
                                            className="peer sr-only"
                                            onChange={(e) =>
                                              checkout.setFormValues({
                                                ...checkout.formValues,
                                                [field.id]: e.target.value,
                                              })
                                            }
                                          />
                                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" />
                                        </div>
                                        <span className="text-white text-sm font-medium">
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
                                      : "text"
                                  }
                                  placeholder={field.placeholder}
                                  className={cn(
                                    "bg-[#2c2c2e] border-none text-white h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 px-4",
                                    field.type === "date" &&
                                      "[color-scheme:dark]"
                                  )}
                                  value={checkout.formValues[field.id] || ""}
                                  onChange={(e) =>
                                    checkout.setFormValues({
                                      ...checkout.formValues,
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
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-neutral-400 ml-1 text-xs">
                          Full Name
                        </Label>
                        <Input
                          required
                          value={checkout.formValues["name"] || ""}
                          onChange={(e) =>
                            checkout.setFormValues({
                              ...checkout.formValues,
                              name: e.target.value,
                            })
                          }
                          className="bg-[#2c2c2e] border-none h-12 rounded-xl text-white px-4"
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-neutral-400 ml-1 text-xs">
                          Phone
                        </Label>
                        <Input
                          required
                          value={checkout.formValues["phone"] || ""}
                          onChange={(e) =>
                            checkout.setFormValues({
                              ...checkout.formValues,
                              phone: e.target.value,
                            })
                          }
                          className="bg-[#2c2c2e] border-none h-12 rounded-xl text-white px-4"
                          placeholder="Phone Number"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-white/5 space-y-6">
                    <div className="flex items-end justify-between bg-[#2c2c2e]/50 p-5 rounded-2xl">
                      <p className="text-sm text-neutral-400 font-medium">
                        Total Due
                      </p>
                      <div className="text-3xl font-bold text-white">
                        $
                        {checkout.calculateTotalPrice(
                          product.price,
                          checkout.selectedVariants,
                          checkout.quantity
                        )}
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={checkout.isSubmitting}
                      className="w-full h-14 text-base font-semibold rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-transform hover:scale-[1.02]"
                    >
                      {checkout.isSubmitting ? (
                        <Loader2 className="animate-spin mr-2 w-5 h-5" />
                      ) : actionType === "whatsapp" ? (
                        <MessageCircle className="mr-2 w-5 h-5" />
                      ) : (
                        <Send className="mr-2 w-5 h-5" />
                      )}
                      {checkout.formTemplate?.button_text ||
                        (actionType === "whatsapp"
                          ? "Confirm via WhatsApp"
                          : "Place Order")}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN SHOP COMPONENT (Grid / Carousel / Modal)
// ==========================================
export default function Shop({
  data,
  id,
  isPreview,
  actorId,
  portfolioId,
}: ShopProps) {
  const products = data.products || [];
  const variant = data.variant || "grid";
  const hasProducts = products.length > 0;

  // 🚀 Initialize Global SDKs (For Grid/Carousel Modal)
  const { carouselRef, scrollCarousel } = UCP.useCarousel();
  const globalCheckout = UCP.useShopOrderForm({
    actorId,
    portfolioId,
    isPreview,
  });

  if (!hasProducts && !isPreview) return null;

  // --- iOS Style Product Card ---
  const CupertinoProductCard = ({ product }: { product: any }) => {
    const isExternal = product.actionType === "link";
    const linkTarget = isExternal ? "_blank" : "_self";
    let href = "#";
    if (isExternal) href = product.checkoutUrl || "#";

    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const images = product.images || (product.image ? [product.image] : []);

    return (
      <div
        className="group h-full flex flex-col bg-[#1c1c1e] rounded-[2rem] overflow-hidden transition-all duration-300 hover:scale-[1.01] shadow-lg cursor-pointer"
        onClick={() => globalCheckout.openProductModal(product)}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-black group/gallery">
          {images.length > 0 ? (
            <>
              <img
                src={images[activeImageIdx]}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover/gallery:scale-105"
              />
              {images.length > 1 && (
                <>
                  <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 opacity-0 group-hover/gallery:opacity-100 transition-opacity z-10">
                    {images.map((_: any, i: number) => (
                      <button
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          i === activeImageIdx
                            ? "bg-white scale-125"
                            : "bg-white/50 hover:bg-white/80"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveImageIdx(i);
                        }}
                      />
                    ))}
                  </div>
                  {/* Apple Style Hover Nav Arrows */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveImageIdx(
                        (prev: number) =>
                          (prev - 1 + images.length) % images.length
                      );
                    }}
                    className="absolute left-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveImageIdx(
                        (prev: number) => (prev + 1) % images.length
                      );
                    }}
                    className="absolute right-4 top-[40%] group-hover/gallery:top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 z-20 backdrop-blur-sm"
                  >
                    <ChevronRight size={18} />
                  </button>{" "}
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              <ShoppingCart size={40} />
            </div>
          )}
          {product.salePrice && (
            <div className="absolute top-4 left-4 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
              Sale
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white tracking-tight mb-1">
              {product.title || "Product Name"}
            </h3>
            <div className="flex items-baseline gap-2">
              {product.salePrice ? (
                <>
                  <span className="text-xl text-blue-400 font-semibold">
                    {product.salePrice}
                  </span>
                  <span className="text-sm text-neutral-500 line-through">
                    {product.price}
                  </span>
                </>
              ) : (
                <span className="text-xl text-white font-semibold">
                  {product.price || "$0.00"}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-neutral-400 leading-relaxed mb-6 line-clamp-2">
            {product.description}
          </p>

          {product.variants && product.variants.length > 0 && (
            <p className="text-xs text-neutral-500 mb-6">
              {product.variants.length} Customization Option
              {product.variants.length > 1 ? "s" : ""} available
            </p>
          )}

          <div className="mt-auto pt-4 border-t border-white/5">
            <button className="w-full h-12 rounded-full text-sm font-semibold transition-all bg-white/10 text-blue-400 hover:bg-white/20 flex items-center justify-center gap-2 pointer-events-none">
              {product.buttonText || "View Details"}
              {isExternal ? (
                <ExternalLink size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const showImageCover =
    globalCheckout.formTemplate?.image &&
    !globalCheckout.isLoadingForm &&
    !globalCheckout.isSuccess;

  return (
    <>
      {/* 🚀 APPLE-STYLE MODAL (For Grid / Carousel variants) */}
      {globalCheckout.isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer animate-in fade-in duration-300"
              onClick={() => globalCheckout.setIsModalOpen(false)}
            />

            <div
              className={cn(
                "relative w-full bg-[#1c1c1e] rounded-t-[2rem] sm:rounded-[2.5rem] p-0 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-400 max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden border border-white/5",
                showImageCover ? "sm:max-w-4xl sm:flex-row" : "sm:max-w-xl"
              )}
            >
              {/* iOS Top Bar */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#1c1c1e]/80 backdrop-blur-xl absolute top-0 left-0 right-0 z-50">
                <button
                  className="text-blue-500 font-medium px-2"
                  onClick={() => globalCheckout.setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <span className="font-semibold text-white text-sm truncate max-w-[200px] text-center">
                  {globalCheckout.selectedProduct?.title}
                </span>
                <div className="w-12" /> {/* Spacer for centering */}
              </div>

              {showImageCover && (
                <div className="hidden sm:flex sm:w-1/2 relative bg-black shrink-0 mt-[60px]">
                  <img
                    src={globalCheckout.formTemplate.image}
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}

              <div
                className={cn(
                  "flex-grow overflow-y-auto flex flex-col p-6 pt-24",
                  // Styled Scrollbars
                  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
                  "[&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full",
                  showImageCover ? "sm:w-1/2" : "w-full"
                )}
              >
                {globalCheckout.isLoadingForm ? (
                  <div className="py-20 flex flex-col items-center justify-center text-blue-500 h-full">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="text-sm text-neutral-400 font-medium">
                      Loading...
                    </p>
                  </div>
                ) : !globalCheckout.formTemplate &&
                  globalCheckout.selectedProduct?.actionType ===
                    "form_order" ? (
                  <div className="py-20 text-center h-full flex items-center justify-center">
                    <p className="text-neutral-400">
                      Checkout template could not be loaded.
                    </p>
                  </div>
                ) : globalCheckout.isSuccess ? (
                  <div className="py-16 text-center space-y-4 animate-in zoom-in-95 h-full flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={40} className="animate-in zoom-in" />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {globalCheckout.formTemplate?.success_title ||
                        "Order Received"}
                    </h3>
                    <p className="text-neutral-400 max-w-sm mx-auto text-sm">
                      {globalCheckout.formTemplate?.success_message ||
                        `Thank you for ordering ${globalCheckout.selectedProduct?.title}. We'll process it shortly.`}
                    </p>
                    <Button
                      className="mt-6 rounded-full px-8 bg-blue-500 text-white hover:bg-blue-600 font-semibold h-12"
                      onClick={() => globalCheckout.setIsModalOpen(false)}
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8 mt-4 sm:mt-0">
                    {globalCheckout.step === "details" && (
                      <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-6">
                        <div className="text-left space-y-2 pb-6 border-b border-white/10">
                          <h3 className="text-2xl font-bold text-white tracking-tight">
                            {globalCheckout.selectedProduct?.title}
                          </h3>
                          <div className="flex items-baseline gap-2 mt-2">
                            {globalCheckout.selectedProduct?.salePrice ? (
                              <>
                                <span className="text-2xl text-blue-400 font-semibold">
                                  {globalCheckout.selectedProduct.salePrice}
                                </span>
                                <span className="text-sm text-neutral-500 line-through">
                                  {globalCheckout.selectedProduct.price}
                                </span>
                              </>
                            ) : (
                              <span className="text-2xl text-white font-semibold">
                                {globalCheckout.selectedProduct?.price ||
                                  "$0.00"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Variants */}
                        {globalCheckout.selectedProduct?.variants &&
                          globalCheckout.selectedProduct.variants.length >
                            0 && (
                            <div className="space-y-4">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                Customization
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {globalCheckout.selectedProduct.variants.map(
                                  (v: any, i: number) => {
                                    const optionsArray =
                                      globalCheckout.parseOptions(v.options);
                                    return (
                                      <div key={i} className="space-y-1.5">
                                        <Label className="text-xs text-neutral-400 ml-1">
                                          {v.name}
                                        </Label>
                                        <select
                                          required
                                          className="w-full bg-[#2c2c2e] text-white h-12 rounded-xl px-4 text-sm appearance-none outline-none focus:ring-2 focus:ring-blue-500"
                                          value={
                                            globalCheckout.selectedVariants[
                                              v.name
                                            ]?.label || ""
                                          }
                                          onChange={(e) => {
                                            const opt = optionsArray.find(
                                              (o: any) =>
                                                o.label === e.target.value
                                            );
                                            globalCheckout.setSelectedVariants({
                                              ...globalCheckout.selectedVariants,
                                              [v.name]: opt,
                                            });
                                          }}
                                        >
                                          <option value="" disabled>
                                            Select {v.name}...
                                          </option>
                                          {optionsArray.map(
                                            (opt: any, optIdx: number) => (
                                              <option
                                                key={optIdx}
                                                value={opt.label}
                                              >
                                                {opt.label}{" "}
                                                {opt.price &&
                                                  `(+$${opt.price})`}
                                              </option>
                                            )
                                          )}
                                        </select>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )}

                        {/* FAQs */}
                        {globalCheckout.selectedProduct?.faqs &&
                          globalCheckout.selectedProduct.faqs.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                                Product Details
                              </h4>
                              <div className="bg-[#2c2c2e] rounded-2xl overflow-hidden divide-y divide-white/5">
                                {globalCheckout.selectedProduct.faqs.map(
                                  (faq: any, i: number) => (
                                    <div key={i}>
                                      <button
                                        type="button"
                                        className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-medium text-white/90 hover:bg-white/5 transition-colors"
                                        onClick={() =>
                                          globalCheckout.setExpandedModalFaq(
                                            globalCheckout.expandedModalFaq ===
                                              i
                                              ? null
                                              : i
                                          )
                                        }
                                      >
                                        <span>{faq.question}</span>
                                        <ChevronDown
                                          size={16}
                                          className={cn(
                                            "transition-transform text-neutral-400",
                                            globalCheckout.expandedModalFaq ===
                                              i && "rotate-180"
                                          )}
                                        />
                                      </button>
                                      {globalCheckout.expandedModalFaq ===
                                        i && (
                                        <div className="px-5 pb-4 text-sm text-neutral-400 leading-relaxed animate-in slide-in-from-top-1 fade-in">
                                          {faq.answer}
                                        </div>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        <div className="pt-6 border-t border-white/5 space-y-6">
                          <div className="flex items-center justify-between">
                            <Label className="text-white font-medium">
                              Quantity
                            </Label>
                            <div className="flex items-center gap-4 bg-[#2c2c2e] rounded-full p-1">
                              <button
                                type="button"
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-30"
                                disabled={globalCheckout.quantity <= 1}
                                onClick={() =>
                                  globalCheckout.setQuantity(
                                    (q: number) => q - 1
                                  )
                                }
                              >
                                <Minus size={16} />
                              </button>
                              <span className="font-semibold w-4 text-center">
                                {globalCheckout.quantity}
                              </span>
                              <button
                                type="button"
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                onClick={() =>
                                  globalCheckout.setQuantity(
                                    (q: number) => q + 1
                                  )
                                }
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>

                          <Button
                            onClick={() =>
                              globalCheckout.proceedToCheckout(
                                globalCheckout.selectedProduct
                              )
                            }
                            className="w-full h-14 text-base font-semibold rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-transform hover:scale-[1.02]"
                          >
                            {globalCheckout.selectedProduct?.buttonText ||
                              "Checkout"}
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {globalCheckout.step === "form" && (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-2 -ml-2 mb-4 border-b border-white/10 pb-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => globalCheckout.setStep("details")}
                            className="text-neutral-400 hover:text-white rounded-full"
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to
                            details
                          </Button>
                        </div>

                        <form
                          onSubmit={globalCheckout.handleFormSubmit}
                          className="space-y-6"
                        >
                          <div className="space-y-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                              Your Details
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {globalCheckout.formTemplate?.fields ? (
                                globalCheckout.formTemplate.fields.map(
                                  (field: any, idx: number) => {
                                    const isHalf = field.width === "half";
                                    const fieldOptions =
                                      globalCheckout.parseOptions(
                                        field.options
                                      );
                                    return (
                                      <div
                                        key={idx}
                                        className={cn(
                                          "space-y-1.5",
                                          isHalf
                                            ? "col-span-1"
                                            : "col-span-1 sm:col-span-2"
                                        )}
                                      >
                                        <Label className="text-neutral-400 flex items-center gap-2 text-xs ml-1">
                                          {field.label}{" "}
                                          {field.required && (
                                            <span className="text-red-400">
                                              *
                                            </span>
                                          )}
                                        </Label>
                                        {field.type === "textarea" ? (
                                          <Textarea
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            className="bg-[#2c2c2e] border-none text-white min-h-[100px] resize-none rounded-xl p-4 focus-visible:ring-2 focus-visible:ring-blue-500"
                                            value={
                                              globalCheckout.formValues[
                                                field.id
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              globalCheckout.setFormValues({
                                                ...globalCheckout.formValues,
                                                [field.id]: e.target.value,
                                              })
                                            }
                                          />
                                        ) : field.type === "select" ? (
                                          <select
                                            required={field.required}
                                            className="w-full bg-[#2c2c2e] border-none text-white h-12 rounded-xl px-4 text-sm appearance-none outline-none focus:ring-2 focus:ring-blue-500"
                                            value={
                                              globalCheckout.formValues[
                                                field.id
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              globalCheckout.setFormValues({
                                                ...globalCheckout.formValues,
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
                                        ) : (
                                          <Input
                                            required={field.required}
                                            type={
                                              field.type === "email"
                                                ? "email"
                                                : field.type === "tel"
                                                ? "tel"
                                                : "text"
                                            }
                                            placeholder={field.placeholder}
                                            className="bg-[#2c2c2e] border-none text-white h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 px-4"
                                            value={
                                              globalCheckout.formValues[
                                                field.id
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              globalCheckout.setFormValues({
                                                ...globalCheckout.formValues,
                                                [field.id]: e.target.value,
                                              })
                                            }
                                          />
                                        )}
                                      </div>
                                    );
                                  }
                                )
                              ) : (
                                <div className="space-y-4 col-span-2">
                                  <div className="space-y-1.5">
                                    <Label className="text-neutral-400 ml-1 text-xs">
                                      Full Name
                                    </Label>
                                    <Input
                                      required
                                      value={
                                        globalCheckout.formValues["name"] || ""
                                      }
                                      onChange={(e) =>
                                        globalCheckout.setFormValues({
                                          ...globalCheckout.formValues,
                                          name: e.target.value,
                                        })
                                      }
                                      className="bg-[#2c2c2e] border-none h-12 rounded-xl text-white px-4"
                                      placeholder="Your Name"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-neutral-400 ml-1 text-xs">
                                      Phone
                                    </Label>
                                    <Input
                                      required
                                      value={
                                        globalCheckout.formValues["phone"] || ""
                                      }
                                      onChange={(e) =>
                                        globalCheckout.setFormValues({
                                          ...globalCheckout.formValues,
                                          phone: e.target.value,
                                        })
                                      }
                                      className="bg-[#2c2c2e] border-none h-12 rounded-xl text-white px-4"
                                      placeholder="Phone Number"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-6 border-t border-white/5 space-y-6">
                            <div className="flex items-end justify-between bg-[#2c2c2e]/50 p-5 rounded-2xl">
                              <p className="text-sm text-neutral-400 font-medium">
                                Total Due
                              </p>
                              <div className="text-2xl font-bold text-white">
                                $
                                {globalCheckout.calculateTotalPrice(
                                  globalCheckout.selectedProduct?.price || "0",
                                  globalCheckout.selectedVariants,
                                  globalCheckout.quantity
                                )}
                              </div>
                            </div>

                            <Button
                              type="submit"
                              disabled={globalCheckout.isSubmitting}
                              className="w-full h-14 text-base font-semibold rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-transform hover:scale-[1.02]"
                            >
                              {globalCheckout.isSubmitting ? (
                                <Loader2 className="animate-spin mr-2 w-5 h-5" />
                              ) : null}
                              {globalCheckout.formTemplate?.button_text ||
                                "Complete Order"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 🚀 THE ACTUAL SHOP SECTION */}
      <section
        className="relative py-24 md:py-32 bg-black overflow-hidden"
        id="shop"
      >
        <div className="container max-w-6xl mx-auto relative z-10 px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20 space-y-4">
            <UCP.Text
              as="h2"
              field="title"
              value={data.title || "Shop"}
              sectionId={id}
              isPreview={isPreview}
              className="text-4xl md:text-5xl font-semibold text-white tracking-tight block"
            />
            <UCP.Text
              as="p"
              field="subheadline"
              value={data.subheadline || "Browse our latest collection."}
              sectionId={id}
              isPreview={isPreview}
              className="text-lg md:text-xl text-neutral-400 block max-w-xl mx-auto leading-relaxed"
            />
          </div>

          {!hasProducts && isPreview && (
            <div className="w-full py-24 border border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center text-white/40 bg-[#1c1c1e]">
              <Store className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium tracking-wide">
                No products added yet.
              </p>
            </div>
          )}

          {hasProducts && (
            <>
              {variant === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {products.map((prod: any, i: number) => (
                    <CupertinoProductCard key={i} product={prod} />
                  ))}
                </div>
              )}

              {/* Spotlight - iOS Feature Card Style */}
              {variant === "spotlight" && products[0] && (
                <div className="max-w-4xl mx-auto">
                  <SpotlightCheckout
                    product={products[0]}
                    actorId={actorId}
                    portfolioId={portfolioId}
                    isPreview={isPreview}
                  />
                </div>
              )}

              {variant === "carousel" && (
                <div className="relative group/carousel -mx-6 px-6 md:mx-0 md:px-0">
                  <button
                    className="absolute left-4 top-[40%] group-hover/carousel:top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 border border-white/10 hidden md:flex backdrop-blur-md"
                    onClick={() => scrollCarousel("left")}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    className="absolute right-4 top-[40%] group-hover/carousel:top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 border border-white/10 hidden md:flex backdrop-blur-md"
                    onClick={() => scrollCarousel("right")}
                  >
                    <ChevronRight size={20} />
                  </button>

                  <div
                    ref={carouselRef}
                    className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory hide-scrollbar"
                  >
                    {products.map((prod: any, i: number) => (
                      <div
                        key={i}
                        className="snap-center shrink-0 w-[85vw] sm:w-[350px]"
                      >
                        <CupertinoProductCard product={prod} />
                      </div>
                    ))}
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

Shop.schema = schema;
