import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // 1. Accept new parameters: email, name, setup_future_usage, currency
    const { amount, email, name, setup_future_usage, currency } = await req.json();
    console.log("Received request for:", { amount, email, name });

    // Validate amount
    if (amount === undefined || amount === null || typeof amount !== 'number' || amount <= 0) {
      throw new Error("Invalid or missing 'amount' in request body.");
    }

    if (!STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key configuration error.");
    }

    // --- 2. LOGIC: Find or Create Customer (Only if email provided) ---
    let customerId = null;
    
    if (email) {
      console.log("Looking up customer by email...");
      const searchParams = new URLSearchParams({ email: email, limit: '1' });
      
      const searchRes = await fetch(`https://api.stripe.com/v1/customers?${searchParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
      });
      
      const searchData = await searchRes.json();
      
      if (searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
        console.log("Found existing customer:", customerId);
      } else {
        console.log("Creating new customer...");
        const createBody = new URLSearchParams();
        createBody.append('email', email);
        if (name) createBody.append('name', name);
        
        const createRes = await fetch("https://api.stripe.com/v1/customers", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: createBody.toString()
        });
        
        const createData = await createRes.json();
        if (createData.id) {
          customerId = createData.id;
          console.log("Created new customer:", customerId);
        }
      }
    }
    // --- End Customer Logic ---


    // --- 3. LOGIC: Create Payment Intent ---
    const stripeApiUrl = "https://api.stripe.com/v1/payment_intents";
    
    // IMPORTANT: Your existing logic multiplies by 100.
    // Ensure your frontend sends "70" (MAD), not "7000" (cents).
    const amountInCents = Math.round(amount * 100); 

    console.log("Creating Payment Intent for:", amountInCents, "cents");

    const body = new URLSearchParams({
      amount: amountInCents.toString(),
      currency: currency || "mad", // Default to MAD if not sent
      'automatic_payment_methods[enabled]': 'true',
    });

    // Add optional fields if they exist
    if (customerId) {
      body.append('customer', customerId);
    }
    
    if (setup_future_usage) {
      // This is what tells Stripe to save the card!
      // typically 'off_session' for subscriptions/admin-charges
      body.append('setup_future_usage', setup_future_usage); 
    }

    const response = await fetch(stripeApiUrl, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.error("Stripe API Error:", responseData);
        throw new Error(responseData.error?.message || `Stripe API request failed with status ${response.status}`);
    }

    console.log("Payment Intent created successfully:", responseData.id);

    return new Response(
      JSON.stringify({ 
        clientSecret: responseData.client_secret,
        // Optional: Return customer ID if useful for your frontend
        customerId: customerId 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error occurred:", error);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});