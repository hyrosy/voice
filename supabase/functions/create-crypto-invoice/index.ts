import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, actor_id, coins_amount } = await req.json();

    if (!amount || !actor_id || !coins_amount) {
      throw new Error("Missing required parameters.");
    }

    // Determine which provider you are using from env variables
    const PROVIDER = Deno.env.get("CRYPTO_PROVIDER") || "nowpayments"; // 'nowpayments' or 'btcpay'

    let invoiceUrl = "";

    // ==========================================
    // 🟢 NOWPAYMENTS INTEGRATION
    // ==========================================
    if (PROVIDER === "nowpayments") {
      const NOWPAYMENTS_API_KEY = Deno.env.get("NOWPAYMENTS_API_KEY");
      if (!NOWPAYMENTS_API_KEY) throw new Error("Missing NOWPAYMENTS_API_KEY");

      const response = await fetch("https://api.nowpayments.io/v1/invoice", {
        method: "POST",
        headers: {
          "x-api-key": NOWPAYMENTS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: "usd",
          order_id: `TOPUP_${actor_id}_${Date.now()}`,
          order_description: `${coins_amount} UCP Coins`,
          // This is where NOWPayments will ping your webhook later!
          ipn_callback_url:
            "https://your-supabase-url.supabase.co/functions/v1/crypto-webhook",
          success_url:
            "https://yourdomain.com/dashboard/settings?tab=billing&topup=success",
          cancel_url:
            "https://yourdomain.com/dashboard/settings?tab=billing&topup=canceled",
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "NOWPayments API Error");

      invoiceUrl = data.invoice_url;
    }

    // ==========================================
    // 🟠 BTCPAY SERVER INTEGRATION
    // ==========================================
    else if (PROVIDER === "btcpay") {
      const BTCPAY_URL = Deno.env.get("BTCPAY_URL"); // e.g., https://btcpay.yourdomain.com
      const BTCPAY_STORE_ID = Deno.env.get("BTCPAY_STORE_ID");
      const BTCPAY_API_KEY = Deno.env.get("BTCPAY_API_KEY");

      if (!BTCPAY_URL || !BTCPAY_STORE_ID || !BTCPAY_API_KEY) {
        throw new Error("Missing BTCPay environment variables");
      }

      const response = await fetch(
        `${BTCPAY_URL}/api/v1/stores/${BTCPAY_STORE_ID}/invoices`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${BTCPAY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amount,
            currency: "USD",
            metadata: {
              orderId: `TOPUP_${actor_id}_${Date.now()}`,
              itemDesc: `${coins_amount} UCP Coins`,
              actor_id: actor_id,
              coins_amount: coins_amount,
            },
            checkout: {
              redirectURL:
                "https://yourdomain.com/dashboard/settings?tab=billing&topup=success",
            },
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error("BTCPay Server API Error");

      invoiceUrl = data.checkoutLink;
    } else {
      throw new Error("Invalid CRYPTO_PROVIDER configured.");
    }

    // Return the generated invoice URL back to the frontend
    return new Response(JSON.stringify({ invoiceUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Crypto Invoice Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
