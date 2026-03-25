import React from "react";
import { useCartStore } from "@/store/useCartStore";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ModernCartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getCartTotal } =
    useCartStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Cart</h2>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.map((item) => (
            <div
              key={`${item.id}-${item.variant}`}
              className="flex gap-4 border-b pb-4"
            >
              <img
                src={item.image}
                className="w-20 h-20 rounded-md object-cover"
              />
              <div className="flex-1">
                <h3 className="font-bold">{item.title}</h3>
                {item.variant && (
                  <p className="text-xs text-muted-foreground">
                    {item.variant}
                  </p>
                )}
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-3 border rounded-md px-2">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          Math.max(0, item.quantity - 1),
                          item.variant
                        )
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1, item.variant)
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="font-bold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t bg-muted/30">
          <div className="flex justify-between text-lg font-bold mb-4">
            <span>Total</span>
            <span>${getCartTotal().toFixed(2)}</span>
          </div>
          <Button size="lg" className="w-full h-14 text-lg">
            Checkout Now
          </Button>
        </div>
      </div>
    </div>
  );
}
