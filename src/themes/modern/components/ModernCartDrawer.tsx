import React from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/useCartStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

// 🚀 1. Added isPreview to block navigation in the builder
export default function ModernCartDrawer({
  username,
  isPreview,
}: {
  username?: string;
  isPreview?: boolean;
}) {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getCartTotal } =
    useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    // 🚀 2. SAFE CHECKOUT: Prevent navigation if in builder mode
    if (isPreview) {
      alert(
        "Checkout is disabled in Preview Mode. Publish your site to test the checkout flow."
      );
      return;
    }

    closeCart();
    if (username) navigate(`/${username}/checkout`);
    else alert("Checkout coming soon!");
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      {/* 🚀 3. THEME FIX: bg-neutral-950 and border-white/10 */}
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-neutral-950 border-l border-white/10 text-white z-[99999]">
        <SheetHeader className="p-6 border-b border-white/10 text-left">
          <SheetTitle className="flex items-center text-2xl font-bold text-white">
            <ShoppingBag className="w-6 h-6 mr-3 text-primary" />
            Your Cart
          </SheetTitle>

          <SheetDescription className="sr-only">
            Review your selected items and proceed to checkout.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
              <ShoppingBag className="w-16 h-16 text-neutral-600" />
              <p className="text-lg font-medium text-neutral-400">
                Your cart is empty.
              </p>
              <Button
                variant="outline"
                onClick={closeCart}
                className="border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.id}-${item.variant}`}
                className="flex gap-4 relative group bg-neutral-900/50 p-3 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="w-20 h-20 rounded-xl border border-white/10 bg-black overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      className="w-full h-full object-cover"
                      alt={item.title}
                    />
                  ) : (
                    <ShoppingBag className="w-6 h-6 m-auto text-neutral-600 mt-7" />
                  )}
                </div>
                <div className="flex flex-col flex-1 py-1">
                  <h3 className="font-bold text-white leading-tight line-clamp-2 pr-6">
                    {item.title}
                  </h3>
                  {item.variant && (
                    <p className="text-xs text-primary font-medium mt-1">
                      {item.variant}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border border-white/10 rounded-lg bg-black mt-2">
                      <button
                        className="px-2 py-1 text-neutral-400 hover:text-white transition-colors"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            Math.max(1, item.quantity - 1),
                            item.variant
                          )
                        }
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold w-6 text-center text-white">
                        {item.quantity}
                      </span>
                      <button
                        className="px-2 py-1 text-neutral-400 hover:text-white transition-colors"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1,
                            item.variant
                          )
                        }
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-bold text-white text-lg">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.id, item.variant)}
                    className="absolute top-3 right-3 p-1.5 bg-black/50 rounded-full text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-neutral-900 border-t border-white/10 space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="text-neutral-400 font-medium">Subtotal</span>
              <span className="text-3xl font-bold text-white">
                ${getCartTotal().toFixed(2)}
              </span>
            </div>
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold rounded-xl bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-all"
              onClick={handleCheckout}
            >
              Proceed to Checkout <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
