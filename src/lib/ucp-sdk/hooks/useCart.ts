import { useCartStore } from "@/store/useCartStore";

export function useCart() {
  const { openCart, getCartCount } = useCartStore();
  return { cartCount: getCartCount(), openCart };
}
