import React, { useState } from "react";
import { createPortal } from "react-dom";
import { BlockProps } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // 🚀 Fixed import
import {
  ShoppingBag,
  ChevronRight,
  ExternalLink,
  Loader2,
  X,
  CheckCircle2,
  ShoppingCart,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  User,
  ChevronDown,
  Minus,
  Plus,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk"; // 🚀 The SDK Magic

// --- PROP EXTENSION ---
// 🚀 Fixes the TypeScript error by telling TS that we are injecting these props from the parent
export interface ShopProps extends BlockProps {
  portfolioId: string;
  actorId: string;
}

// --- SCHEMA & DEFAULTS ---
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
  title: "Shop",
  subheadline: "Browse our latest collection.",
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

const Shop: React.FC<ShopProps> = ({
  data,
  id,
  isPreview,
  actorId,
  portfolioId,
}) => {
  const products = data.products || [];
  const variant = data.variant || "grid";
  const hasProducts = products.length > 0;

  // 🚀 Initialize SDKs
  const { carouselRef, scrollCarousel } = UCP.useCarousel();

  const {
    selectedProduct,
    setSelectedProduct,
    formTemplate,
    isModalOpen,
    setIsModalOpen,
    isLoadingForm,
    isSubmitting,
    isSuccess,
    formValues,
    setFormValues,
    selectedVariants,
    setSelectedVariants,
    quantity,
    setQuantity,
    expandedModalFaq,
    setExpandedModalFaq,
    parseOptions,
    calculateTotalPrice,
    handleProductAction,
    handleFormSubmit,
  } = UCP.useShopOrderForm({ actorId, portfolioId, isPreview });

  if (!hasProducts && !isPreview) return null;

  // --- iOS Style Product Card ---
  const CupertinoProductCard = ({ product }: { product: any }) => {
    const isExternal = product.actionType === "link";
    const linkTarget = isExternal ? "_blank" : "_self";

    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const images = product.images || (product.image ? [product.image] : []);

    return (
      <div
        className="group h-full flex flex-col bg-[#1c1c1e] rounded-[2rem] overflow-hidden transition-all duration-300 hover:scale-[1.01] shadow-lg cursor-pointer"
        onClick={(e) => handleProductAction(product, e)}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-black group/gallery">
          {images.length > 0 ? (
            <img
              src={images[activeImageIdx]}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover/gallery:scale-105"
            />
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

  const showImageCover = formTemplate?.image && !isLoadingForm && !isSuccess;

  return (
    <>
      {/* 🚀 APPLE-STYLE MODAL (Bottom Sheet style on Mobile, Floating Dialog on Desktop) */}
      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer animate-in fade-in duration-300"
              onClick={() => setIsModalOpen(false)}
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
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <span className="font-semibold text-white text-sm truncate max-w-[200px] text-center">
                  {selectedProduct?.title}
                </span>
                <div className="w-12" /> {/* Spacer for centering */}
              </div>

              {showImageCover && (
                <div className="hidden sm:flex sm:w-1/2 relative bg-black shrink-0 mt-[60px]">
                  <img
                    src={formTemplate.image}
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}

              <div
                className={cn(
                  "flex-grow overflow-y-auto flex flex-col p-6 pt-24",
                  // Hide scrollbars for a clean iOS feel
                  "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
                  showImageCover ? "sm:w-1/2" : "w-full"
                )}
              >
                {isLoadingForm ? (
                  <div className="py-20 flex flex-col items-center justify-center text-blue-500 h-full">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="text-sm text-neutral-400 font-medium">
                      Loading...
                    </p>
                  </div>
                ) : !formTemplate &&
                  selectedProduct?.actionType === "form_order" ? (
                  <div className="py-20 text-center h-full flex items-center justify-center">
                    <p className="text-neutral-400">
                      Checkout template could not be loaded.
                    </p>
                  </div>
                ) : isSuccess ? (
                  <div className="py-16 text-center space-y-4 animate-in zoom-in-95 h-full flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={40} className="animate-in zoom-in" />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {formTemplate?.success_title || "Order Received"}
                    </h3>
                    <p className="text-neutral-400 max-w-sm mx-auto text-sm">
                      {formTemplate?.success_message ||
                        `Thank you for ordering ${selectedProduct?.title}. We'll process it shortly.`}
                    </p>
                    <Button
                      className="mt-6 rounded-full px-8 bg-blue-500 text-white hover:bg-blue-600 font-semibold h-12"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8 mt-4 sm:mt-0">
                    <div className="text-left space-y-2 pb-6 border-b border-white/10">
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        {formTemplate?.title || "Complete Your Order"}
                      </h3>
                      <p className="text-sm text-neutral-400">
                        {formTemplate?.subheadline ||
                          "Please fill in your details to finalize."}
                      </p>

                      <div className="mt-4 p-4 rounded-2xl bg-white/5 flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0">
                          <img
                            src={
                              selectedProduct?.images?.[0] ||
                              selectedProduct?.image
                            }
                            alt={selectedProduct?.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="font-semibold text-white truncate text-sm">
                            {selectedProduct?.title}
                          </h4>
                          <div className="text-blue-400 text-sm mt-1 font-medium">
                            {selectedProduct?.price}
                          </div>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleFormSubmit} className="space-y-8">
                      {/* VARIANTS */}
                      {selectedProduct?.variants &&
                        selectedProduct.variants.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                              Customization
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {selectedProduct.variants.map(
                                (v: any, i: number) => {
                                  const optionsArray = Array.isArray(v.options)
                                    ? v.options.map((o: any) =>
                                        typeof o === "string"
                                          ? { label: o.trim(), price: "" }
                                          : o
                                      )
                                    : typeof v.options === "string"
                                    ? v.options.split(",").map((s: string) => ({
                                        label: s.trim(),
                                        price: "",
                                      }))
                                    : [];
                                  return (
                                    <div key={i} className="space-y-1.5">
                                      <Label className="text-xs text-neutral-400 ml-1">
                                        {v.name}
                                      </Label>
                                      <select
                                        required
                                        className="w-full bg-[#2c2c2e] text-white h-12 rounded-xl px-4 text-sm appearance-none outline-none focus:ring-2 focus:ring-blue-500"
                                        value={
                                          selectedVariants[v.name]?.label || ""
                                        }
                                        onChange={(e) => {
                                          const opt = optionsArray.find(
                                            (o: any) =>
                                              o.label === e.target.value
                                          );
                                          setSelectedVariants({
                                            ...selectedVariants,
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
                                              {opt.price && `(+$${opt.price})`}
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
                      {selectedProduct?.faqs &&
                        selectedProduct.faqs.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                              Product Details
                            </h4>
                            <div className="bg-[#2c2c2e] rounded-2xl overflow-hidden divide-y divide-white/5">
                              {selectedProduct.faqs.map(
                                (faq: any, i: number) => (
                                  <div key={i}>
                                    <button
                                      type="button"
                                      className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-medium text-white/90 hover:bg-white/5 transition-colors"
                                      onClick={() =>
                                        setExpandedModalFaq(
                                          expandedModalFaq === i ? null : i
                                        )
                                      }
                                    >
                                      <span>{faq.question}</span>
                                      <ChevronDown
                                        size={16}
                                        className={cn(
                                          "transition-transform text-neutral-400",
                                          expandedModalFaq === i && "rotate-180"
                                        )}
                                      />
                                    </button>
                                    {expandedModalFaq === i && (
                                      <div className="px-5 pb-4 text-sm text-neutral-400 leading-relaxed">
                                        {faq.answer}
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* FORM FIELDS */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Your Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {formTemplate?.fields ? (
                            formTemplate.fields.map(
                              (field: any, idx: number) => {
                                const isHalf = field.width === "half";
                                const fieldOptions = parseOptions(
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
                                        <span className="text-red-400">*</span>
                                      )}
                                    </Label>
                                    {field.type === "textarea" ? (
                                      <Textarea
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        className="bg-[#2c2c2e] border-none text-white min-h-[100px] resize-none rounded-xl p-4 focus-visible:ring-2 focus-visible:ring-blue-500"
                                        value={formValues[field.id] || ""}
                                        onChange={(e) =>
                                          setFormValues({
                                            ...formValues,
                                            [field.id]: e.target.value,
                                          })
                                        }
                                      />
                                    ) : field.type === "select" ? (
                                      <select
                                        required={field.required}
                                        className="w-full bg-[#2c2c2e] border-none text-white h-12 rounded-xl px-4 text-sm appearance-none outline-none focus:ring-2 focus:ring-blue-500"
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
                            )
                          ) : (
                            <div className="space-y-4 col-span-2">
                              <div className="space-y-1.5">
                                <Label className="text-neutral-400 ml-1 text-xs">
                                  Full Name
                                </Label>
                                <Input
                                  required
                                  value={formValues["name"] || ""}
                                  onChange={(e) =>
                                    setFormValues({
                                      ...formValues,
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
                                  value={formValues["phone"] || ""}
                                  onChange={(e) =>
                                    setFormValues({
                                      ...formValues,
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

                      <div className="pt-6 border-t border-white/10 space-y-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-white font-medium">
                            Quantity
                          </Label>
                          <div className="flex items-center gap-4 bg-[#2c2c2e] rounded-full p-1">
                            <button
                              type="button"
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-30"
                              disabled={quantity <= 1}
                              onClick={() => setQuantity((q: number) => q - 1)}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="font-semibold w-4 text-center">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                              onClick={() => setQuantity((q: number) => q + 1)}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-end justify-between">
                          <p className="text-sm text-neutral-400 font-medium">
                            Total Due
                          </p>
                          <div className="text-2xl font-bold text-white">
                            $
                            {calculateTotalPrice(
                              selectedProduct?.price || "0",
                              selectedVariants,
                              quantity
                            )}
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-14 text-base font-semibold rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-transform hover:scale-[1.02]"
                        >
                          {isSubmitting ? (
                            <Loader2 className="animate-spin mr-2 w-5 h-5" />
                          ) : null}
                          {formTemplate?.button_text || "Place Order"}
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

      {/* 🚀 THE ACTUAL SHOP SECTION */}
      <section
        className="relative py-24 md:py-32 bg-black overflow-hidden"
        id="shop"
      >
        <div className="container max-w-6xl mx-auto relative z-10 px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20 space-y-4">
            <UCP.Text
              tagName="h2"
              className="text-4xl md:text-5xl font-semibold text-white tracking-tight block"
              text={data.title || "Shop"}
              sectionId={id}
              fieldKey="title"
              isPreview={isPreview}
            />
            <UCP.Text
              tagName="p"
              className="text-lg md:text-xl text-neutral-400 block max-w-xl mx-auto leading-relaxed"
              text={data.subheadline || "Browse our latest collection."}
              sectionId={id}
              fieldKey="subheadline"
              isPreview={isPreview}
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
                  <div
                    className="group flex flex-col md:flex-row bg-[#1c1c1e] rounded-[2rem] overflow-hidden transition-all duration-300 hover:scale-[1.01] shadow-2xl cursor-pointer"
                    onClick={(e) => handleProductAction(products[0], e)}
                  >
                    <div className="md:w-1/2 relative aspect-square md:aspect-auto">
                      <img
                        src={products[0].images?.[0] || products[0].image}
                        alt={products[0].title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                      {products[0].salePrice && (
                        <div className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest w-max mb-4">
                          Sale
                        </div>
                      )}
                      <h3 className="text-3xl font-bold text-white mb-2">
                        {products[0].title}
                      </h3>
                      <div className="text-2xl text-white font-medium mb-4">
                        {products[0].salePrice || products[0].price}
                      </div>
                      <p className="text-neutral-400 leading-relaxed mb-8">
                        {products[0].description}
                      </p>
                      <button className="w-full h-14 rounded-full bg-white text-black font-bold text-lg hover:bg-neutral-200 transition-colors">
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {variant === "carousel" && (
                <div className="relative group/carousel -mx-6 px-6 md:mx-0 md:px-0">
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
};

export default Shop;
