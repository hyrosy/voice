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

// The UI only receives what it needs to render!
export default function ModernCartDrawer({ username }: { username?: string }) {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getCartTotal } =
    useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    if (username) navigate(`/${username}/checkout`);
    else alert("Checkout coming soon!");
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-background border-l border-border">
        <SheetHeader className="p-6 border-b border-border text-left">
          <SheetTitle className="flex items-center text-2xl font-bold text-foreground">
            <ShoppingBag className="w-6 h-6 mr-3" />
            Your Cart
          </SheetTitle>

          {/* ADD THIS: Hidden description for screen readers to fix the warning */}
          <SheetDescription className="sr-only">
            Review your selected items and proceed to checkout.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
              <ShoppingBag className="w-16 h-16 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">
                Your cart is empty.
              </p>
              <Button variant="outline" onClick={closeCart}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.id}-${item.variant}`}
                className="flex gap-4 relative group"
              >
                <div className="w-20 h-20 rounded-xl border border-border bg-muted overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="w-6 h-6 m-auto text-muted-foreground opacity-50" />
                  )}
                </div>
                <div className="flex flex-col flex-1 py-1">
                  <h3 className="font-bold text-foreground leading-tight line-clamp-2">
                    {item.title}
                  </h3>
                  {item.variant && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.variant}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border border-border rounded-lg bg-background mt-2">
                      <button
                        className="px-2 py-1 text-muted-foreground hover:text-foreground"
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
                      <span className="text-sm font-medium w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        className="px-2 py-1 text-muted-foreground hover:text-foreground"
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
                    <span className="font-bold text-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.id, item.variant)}
                    className="absolute top-1 right-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-muted/30 border-t border-border space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="text-muted-foreground font-medium">
                Subtotal
              </span>
              <span className="text-2xl font-bold text-foreground">
                ${getCartTotal().toFixed(2)}
              </span>
            </div>
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold rounded-xl"
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
