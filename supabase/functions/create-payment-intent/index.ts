import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Remove the Stripe library import:
// import Stripe from "https://esm.sh/stripe@10.12.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get the Stripe Secret Key from environment variables
const STRIPE_SECRET_KEY = Deno.env.toObject().STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error("CRITICAL: STRIPE_SECRET_KEY environment variable not found!");
}

serve(async (req) => {
  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Function invoked, attempting to parse JSON body...");
    const { amount } = await req.json();
    console.log("Received amount:", amount);

    // Validate amount
    if (amount === undefined || amount === null || typeof amount !== 'number' || amount <= 0) {
      console.error("Invalid or missing amount received:", amount);
      throw new Error("Invalid or missing 'amount' in request body.");
    }

    if (!STRIPE_SECRET_KEY) {
      console.error("Stripe secret key is missing when trying to create intent.");
      throw new Error("Stripe secret key configuration error.");
    }

    // --- Use fetch to call Stripe API directly ---
    const stripeApiUrl = "https://api.stripe.com/v1/payment_intents";
    const amountInCents = Math.round(amount * 100);

    console.log("Attempting to create Payment Intent via fetch with amount:", amountInCents);

    // Stripe requires form-urlencoded data for this endpoint
    const body = new URLSearchParams({
      amount: amountInCents.toString(),
      currency: "mad",
      'automatic_payment_methods[enabled]': 'true', // Use bracket notation for nested params
    });

    const response = await fetch(stripeApiUrl, {
      method: "POST",
      headers: {
        // Use the Secret Key for Authorization
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(), // Send as form-urlencoded string
    });

    const responseData = await response.json();

    // Check if the Stripe API call was successful
    if (!response.ok) {
        console.error("Stripe API Error:", responseData);
        throw new Error(responseData.error?.message || `Stripe API request failed with status ${response.status}`);
    }

    console.log("Payment Intent created successfully:", responseData.id);

    // Check if client_secret exists in the response
    if (!responseData.client_secret) {
        console.error("Client secret not found in Stripe response:", responseData);
        throw new Error("Failed to retrieve client secret from Stripe.");
    }

    // Return successful response with the client_secret
    return new Response(
      JSON.stringify({ client_secret: responseData.client_secret }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    // --- End of fetch logic ---

  } catch (error) {
    console.error("Error occurred in create-payment-intent function:", error);
    // Log specific Stripe error details if available from responseData in catch block
    // (You might need to adjust error handling slightly based on fetch failures vs. Stripe API errors)
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});