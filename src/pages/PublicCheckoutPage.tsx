import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useCartStore, type CartItem } from "@/store/useCartStore";
import { supabase } from "../supabaseClient"; // Adjust path if needed
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Lock, ShoppingBag, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// 🚀 Initialize Stripe outside the render cycle so it doesn't recreate on every state change
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_YOUR_STRIPE_PUBLIC_KEY"
);

// --- THE STRIPE FORM COMPONENT ---
const StripeCheckoutForm = ({
  amount,
  portfolioId,
  items,
  onComplete,
}: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !name || !email) return;

    setIsProcessing(true);
    setErrorMessage("");

    // 1. Confirm the payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required", // Do not automatically redirect; we need to save the order first
      confirmParams: {
        payment_method_data: {
          billing_details: { name, email },
        },
      },
    });

    if (error) {
      setErrorMessage(error.message || "Payment failed.");
      setIsProcessing(false);
      return;
    }

    // 2. If successful, record the order in Supabase
    if (paymentIntent && paymentIntent.status === "succeeded") {
      const { error: dbError } = await supabase.from("pro_orders").insert({
        portfolio_id: portfolioId,
        customer_email: email,
        customer_name: name,
        amount_cents: amount * 100,
        status: "paid",
        items: items,
        stripe_payment_intent_id: paymentIntent.id,
      });

      if (dbError) {
        console.error("Failed to save order to DB:", dbError);
        // Depending on your architecture, you might want to alert an admin here,
        // but the payment HAS succeeded, so we still show the success screen to the fan.
      }
      onComplete(); // Trigger the success screen and clear cart
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block text-foreground">
            Full Name
          </label>
          <Input
            required
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-background"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block text-foreground">
            Email Address
          </label>
          <Input
            required
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <label className="text-sm font-medium mb-3 block text-foreground">
          Payment Details
        </label>
        {/* Renders the secure credit card / Apple Pay input */}
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity"
      >
        {isProcessing ? (
          <Loader2 className="animate-spin mr-2" />
        ) : (
          <Lock size={18} className="mr-2" />
        )}
        Pay ${amount.toFixed(2)}
      </Button>
    </form>
  );
};

// --- MAIN PAGE COMPONENT ---
const PublicCheckoutPage = () => {
  // Grab the portfolio context passed down from CheckoutLayout
  const { portfolio } = useOutletContext<{ portfolio: any }>();
  const { items, clearCart } = useCartStore();
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    // If cart is empty, bounce them back to the shop
    if (items.length === 0 && !isSuccess) {
      navigate(`/pro/${portfolio.public_slug}/shop`);
      return;
    }

    // Request the Payment Intent from your Supabase Edge Function
    const initializeCheckout = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "create-payment-intent",
          {
            body: { amount: total * 100, portfolioId: portfolio.id }, // Total in cents
          }
        );

        if (error) throw error;
        if (data.error) throw new Error(data.error);
        if (data.clientSecret) setClientSecret(data.clientSecret);
      } catch (err: any) {
        if (err.message === "SELLER_NOT_CONNECTED") {
          setInitError(
            "This seller is currently not accepting automated payments."
          );
        } else {
          setInitError(
            "Checkout is currently unavailable. Please try again later."
          );
        }
      }
    };

    if (total > 0 && !isSuccess) initializeCheckout();
  }, [items, total, portfolio.id, portfolio.public_slug, navigate, isSuccess]);

  const handleSuccess = () => {
    clearCart();
    setIsSuccess(true);
  };

  // --- SUCCESS VIEW ---
  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2
            size={40}
            className="text-green-600 dark:text-green-400"
          />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground">
            Payment Successful!
          </h1>
          <p className="text-muted-foreground mt-2">
            Your receipt has been sent to your email. The seller has been
            notified of your order.
          </p>
        </div>
        <Button
          onClick={() => navigate(`/pro/${portfolio.public_slug}`)}
          className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Return to Website
        </Button>
      </div>
    );
  }

  // --- CHECKOUT VIEW ---
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-8">
      {/* LEFT COLUMN: ORDER SUMMARY */}
      <div className="lg:col-span-5 order-2 lg:order-1">
        <div className="bg-card text-card-foreground p-6 md:p-8 rounded-3xl border shadow-sm sticky top-24">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <ShoppingBag size={20} /> Order Summary
          </h2>

          <div className="space-y-4 mb-6">
            {items.map((item: CartItem) => (
              <div
                key={item.id}
                className="flex justify-between items-start gap-4"
              >
                <div>
                  <div className="font-semibold text-foreground">
                    {item.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Qty: {item.quantity}
                  </div>
                </div>
                <div className="font-medium text-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>Taxes & Fees</span>
              <span>Calculated at next step</span>
            </div>
            <div className="flex justify-between font-black text-xl pt-2 border-t border-border mt-2 text-foreground">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: PAYMENT GATEWAY */}
      <div className="lg:col-span-7 order-1 lg:order-2">
        <div className="bg-card text-card-foreground p-6 md:p-8 rounded-3xl border shadow-sm">
          <h2 className="text-2xl font-black mb-6">Secure Checkout</h2>

          {initError ? (
            <div className="p-6 bg-destructive/10 rounded-2xl border border-destructive/20 text-center">
              <p className="text-destructive font-semibold">{initError}</p>
            </div>
          ) : !clientSecret ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Initializing secure connection...</p>
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: "stripe" } }}
            >
              <StripeCheckoutForm
                amount={total}
                portfolioId={portfolio.id}
                items={items}
                onComplete={handleSuccess}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicCheckoutPage;
