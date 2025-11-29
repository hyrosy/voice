import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STRIPE_SECRET_KEY = Deno.env.toObject().STRIPE_SECRET_KEY;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { amount, customerId } = await req.json();

    if (!customerId || !amount) throw new Error("Missing params");

    // CALL STRIPE TO CHARGE NOW
    const stripeApiUrl = "https://api.stripe.com/v1/payment_intents";
    const body = new URLSearchParams({
      amount: Math.round(amount * 100).toString(), // Convert to cents
      currency: "mad",
      customer: customerId,
      // The magic flags for "Charging a saved card while user is offline":
      'payment_method_types[]': 'card',
      confirm: 'true',
      off_session: 'true', 
    });

    // We need to find the default payment method first, usually Stripe handles this 
    // if 'automatic_payment_methods' is enabled, but for off_session we often point to the customer.
    // To keep it simple using fetch, we let Stripe find the default method attached to customer.
    // Note: In some Stripe configs you might need to pass `payment_method`. 
    // Let's try the simplest "Charge Customer" approach first.

    const response = await fetch(stripeApiUrl, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Stripe Charge Error:", data);
        throw new Error(data.error?.message || "Charge failed");
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});