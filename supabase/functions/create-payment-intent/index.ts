// In supabase/functions/create-payment-intent/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@10.12.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- THIS IS THE CORRECTED PART ---
// Use Deno.env.toObject() for a more robust way to get secrets
const STRIPE_SECRET_KEY = Deno.env.toObject().STRIPE_SECRET_KEY;

const stripe = Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});
// --- END OF CORRECTION ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount } = await req.json();
    
    // Add a check to ensure the secret key was loaded
    if (!STRIPE_SECRET_KEY) {
        throw new Error("Stripe secret key not found.");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "mad",
      automatic_payment_methods: { enabled: true },
    });

    return new Response(
      JSON.stringify({ client_secret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});