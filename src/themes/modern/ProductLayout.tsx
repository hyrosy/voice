import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  MessageCircle,
  FileText,
  CheckCircle2,
  ExternalLink,
  User,
  Phone,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductLayoutProps } from "../../pages/product-layouts/types"; // <-- Importing the rules!

export default function ModernProductLayout({
  product,
  username,
  currentPrice,
  quantity,
  setQuantity,
  selectedVariants,
  setSelectedVariants,
  activeImgIndex,
  setActiveImgIndex,
  step,
  setStep,
  clientInfo,
  setClientInfo,
  isSubmitting,
  handleMainAction,
  handleConfirmOrder,
}: ProductLayoutProps) {
  const images = product.images?.length
    ? product.images
    : ["https://via.placeholder.com/600x600?text=No+Image"];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* HEADER / BREADCRUMBS */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center text-sm text-muted-foreground">
          <Link
            to={`/${username}`}
            className="hover:text-foreground transition-colors font-medium"
          >
            {username}
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
          <Link
            to={`/${username}/shop`}
            className="hover:text-foreground transition-colors font-medium"
          >
            Shop
          </Link>

          {product.pro_collections?.title && (
            <>
              <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
              <Link
                to={`/${username}/shop/collections/${product.pro_collections.slug}`}
                className="hover:text-foreground transition-colors font-medium"
              >
                {product.pro_collections.title}
              </Link>
            </>
          )}

          <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
          <span className="text-foreground truncate">{product.title}</span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* LEFT: IMAGE GALLERY (Sticky) */}
          <div className="w-full lg:w-1/2 flex flex-col space-y-4 lg:sticky lg:top-24 lg:h-max">
            <div className="aspect-square bg-muted border border-border rounded-2xl overflow-hidden flex items-center justify-center relative">
              <img
                src={images[activeImgIndex]}
                alt={product.title}
                className="w-full h-full object-cover animate-in fade-in duration-500"
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIndex(idx)}
                    className={cn(
                      "w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                      activeImgIndex === idx
                        ? "border-primary"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt={`Thumbnail ${idx}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: PRODUCT DETAILS & CHECKOUT */}
          <div className="w-full lg:w-1/2 flex flex-col">
            {step === "success" ? (
              <div className="flex flex-col items-center justify-center text-center space-y-6 py-20 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-500/20 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">Order Confirmed!</h2>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Thank you, {clientInfo.name}. We've received your request
                    for <strong>{product.title}</strong>. We will reach out to
                    you shortly.
                  </p>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border hover:bg-muted"
                  asChild
                >
                  <Link to={`/${username}/shop`}>Continue Shopping</Link>
                </Button>
              </div>
            ) : step === "form" ? (
              <div className="animate-in slide-in-from-right-8 duration-300">
                <Button
                  variant="ghost"
                  onClick={() => setStep("details")}
                  className="-ml-4 mb-6 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Product
                </Button>
                <h2 className="text-3xl font-bold mb-8">Shipping Details</h2>

                <div className="space-y-6 bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        value={clientInfo.name}
                        onChange={(e) =>
                          setClientInfo({ ...clientInfo, name: e.target.value })
                        }
                        placeholder="Your Name"
                        className="bg-background border-border pl-11 h-12 text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        value={clientInfo.phone}
                        onChange={(e) =>
                          setClientInfo({
                            ...clientInfo,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+1 234 567 890"
                        className="bg-background border-border pl-11 h-12 text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">
                      Delivery Address
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        value={clientInfo.address}
                        onChange={(e) =>
                          setClientInfo({
                            ...clientInfo,
                            address: e.target.value,
                          })
                        }
                        placeholder="Street, City, Zip Code"
                        className="bg-background border-border pl-11 h-12 text-base"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-lg text-muted-foreground">
                        Total Estimate:
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        ${(currentPrice * quantity).toFixed(2)}
                      </span>
                    </div>
                    <Button
                      size="lg"
                      disabled={isSubmitting}
                      className={cn(
                        "w-full h-14 text-lg font-semibold",
                        product.action_type === "whatsapp"
                          ? "bg-green-600 hover:bg-green-500 text-white"
                          : ""
                      )}
                      onClick={handleConfirmOrder}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : product.action_type === "whatsapp" ? (
                        <MessageCircle className="mr-2 w-5 h-5" />
                      ) : (
                        <FileText className="mr-2 w-5 h-5" />
                      )}
                      {isSubmitting
                        ? "Processing..."
                        : product.action_type === "whatsapp"
                        ? "Confirm via WhatsApp"
                        : "Confirm Order"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                {product.pro_collections?.title && (
                  <Badge
                    variant="outline"
                    className="mb-4 border-primary text-primary px-3 py-1 uppercase tracking-widest text-[10px] font-bold"
                  >
                    {product.pro_collections.title}
                  </Badge>
                )}

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
                  {product.title}
                </h1>

                <div className="flex items-center gap-4 mb-8">
                  <span className="text-3xl font-bold text-foreground">
                    ${currentPrice.toFixed(2)}
                  </span>
                  {product.compare_at_price > currentPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      ${product.compare_at_price.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed mb-10">
                  {product.description
                    .split("\n")
                    .map((line: string, i: number) => (
                      <p key={i}>{line}</p>
                    ))}
                </div>

                {/* DYNAMIC OPTIONS / VARIANTS */}
                {product.options?.length > 0 && (
                  <div className="space-y-6 mb-8 border-y border-border py-8">
                    {product.options.map((opt: any) => (
                      <div key={opt.name} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm uppercase tracking-widest text-muted-foreground font-bold">
                            {opt.name}
                          </Label>
                          <span className="text-xs text-primary">
                            {selectedVariants[opt.name]?.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {opt.values.map((val: any) => {
                            const isSelected =
                              selectedVariants[opt.name]?.label === val.label;
                            return (
                              <button
                                key={val.label}
                                onClick={() =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [opt.name]: val,
                                  }))
                                }
                                className={cn(
                                  "px-5 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 flex items-center gap-2",
                                  isSelected
                                    ? "border-primary bg-primary/10 text-foreground"
                                    : "border-border text-muted-foreground hover:border-foreground hover:bg-muted bg-background"
                                )}
                              >
                                {val.label}
                                {val.price && (
                                  <span
                                    className={cn(
                                      "text-xs opacity-70",
                                      isSelected
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    +${val.price}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* QUANTITY & ACTIONS */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  {product.action_type !== "link" && (
                    <div className="flex items-center justify-between border-2 border-border rounded-xl px-4 h-14 w-full sm:w-1/3 bg-background">
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      >
                        <Minus size={20} />
                      </button>
                      <span className="font-mono text-lg font-bold">
                        {quantity}
                      </span>
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setQuantity((q) => q + 1)}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="flex-1 h-14 text-lg font-bold rounded-xl shadow-lg transition-transform active:scale-[0.98]"
                    onClick={handleMainAction}
                  >
                    {product.action_type === "link"
                      ? "Buy Now"
                      : product.action_type === "cart"
                      ? "Add to Cart"
                      : "Order Now"}
                    {product.action_type === "link" ? (
                      <ExternalLink className="ml-2 w-5 h-5" />
                    ) : product.action_type === "cart" ? (
                      <ShoppingBag className="ml-2 w-5 h-5" />
                    ) : (
                      <ArrowRight className="ml-2 w-5 h-5" />
                    )}
                  </Button>
                </div>

                {/* INVENTORY BADGE */}
                {product.track_inventory && (
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        product.stock_count > 5
                          ? "bg-green-500"
                          : "bg-orange-500 animate-pulse"
                      )}
                    />
                    <span className="text-muted-foreground">
                      {product.stock_count > 0 ? (
                        `${product.stock_count} items remaining in stock`
                      ) : (
                        <span className="text-destructive">Out of stock</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
