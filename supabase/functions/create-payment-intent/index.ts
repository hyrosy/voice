import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SECRET_KEY = Deno.env.toObject().STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error("CRITICAL: STRIPE_SECRET_KEY environment variable not found!");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Accept metadata alongside the existing fields
    const { amount, email, name, setup_future_usage, currency, metadata } =
      await req.json();

    if (
      amount === undefined ||
      amount === null ||
      typeof amount !== "number" ||
      amount <= 0
    ) {
      throw new Error("Invalid or missing 'amount' in request body.");
    }

    if (!STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key configuration error.");
    }

    // --- 2. LOGIC: Find or Create Customer ---
    let customerId = null;

    if (email) {
      const searchParams = new URLSearchParams({ email: email, limit: "1" });
      const searchRes = await fetch(
        `https://api.stripe.com/v1/customers?${searchParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        }
      );

      const searchData = await searchRes.json();

      if (searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
      } else {
        const createBody = new URLSearchParams();
        createBody.append("email", email);
        if (name) createBody.append("name", name);

        const createRes = await fetch("https://api.stripe.com/v1/customers", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: createBody.toString(),
        });

        const createData = await createRes.json();
        if (createData.id) {
          customerId = createData.id;
        }
      }
    }

    // --- 3. LOGIC: Create Payment Intent ---
    const stripeApiUrl = "https://api.stripe.com/v1/payment_intents";

    // SAFE: We keep the original * 100 logic so marketplace orders still work.
    const amountInCents = Math.round(amount * 100);

    const body = new URLSearchParams({
      amount: amountInCents.toString(),
      currency: currency || "mad", // SAFE: Defaults back to MAD for existing orders!
      "automatic_payment_methods[enabled]": "true",
    });

    if (customerId) {
      body.append("customer", customerId);
    }

    if (setup_future_usage) {
      body.append("setup_future_usage", setup_future_usage);
    }

    // SAFELY APPEND METADATA (Only if the frontend sent it)
    if (metadata && typeof metadata === "object") {
      for (const [key, value] of Object.entries(metadata)) {
        body.append(`metadata[${key}]`, String(value));
      }
    }

    const response = await fetch(stripeApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        responseData.error?.message ||
          `Stripe API request failed with status ${response.status}`
      );
    }

    return new Response(
      JSON.stringify({
        clientSecret: responseData.client_secret,
        customerId: customerId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error occurred:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
