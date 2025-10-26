import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2' // Use standard Supabase client

// Define expected shape of incoming order data
interface OrderData {
  order_id_string: string;
  actor_id: string;
  client_name: string;
  client_email: string;
  word_count: number;
  usage: string;
  total_price: number;
  script: string;
  payment_method: 'stripe' | 'bank';
  stripe_payment_intent_id?: string | null;
  status: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or restrict to your Vercel domain in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("create-order function invoked.");
    // 1. Get data from request body
    const orderData = await req.json() as OrderData;
    console.log("Received order data:", orderData);

    // 2. **Crucial:** Input Validation (Add more checks as needed!)
    if (!orderData.actor_id || !orderData.client_email || !orderData.client_name) {
        throw new Error('Missing required order fields (actor_id, client_email, client_name).');
    }
    // Add checks for data types, lengths, valid enums (usage, payment_method, status) etc.

    // 3. Create Supabase Admin Client (Bypasses RLS)
    // **Important:** Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
    // in your Supabase project's Function settings (Secrets).
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log("Supabase admin client initialized.");

    // 4. Insert the order using the Admin client
    const { data: newOrder, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert({
        // Map validated data to table columns
        order_id_string: orderData.order_id_string,
        actor_id: orderData.actor_id,
        client_name: orderData.client_name,
        client_email: orderData.client_email.toLowerCase(), // Ensure lowercase
        word_count: orderData.word_count,
        usage: orderData.usage,
        total_price: orderData.total_price,
        script: orderData.script,
        payment_method: orderData.payment_method,
        stripe_payment_intent_id: orderData.stripe_payment_intent_id,
        status: orderData.status,
        client_id: null // Ensure client_id is null initially
      })
      .select() // Select the inserted row
      .single(); // Expect only one row back

    if (insertError) {
      console.error("Error inserting order:", insertError);
      throw insertError; // Throw error to be caught below
    }

    console.log("Order inserted successfully:", newOrder);

    // 5. Return success response with the new order data
    return new Response(
      JSON.stringify(newOrder),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // OK
      }
    )
  } catch (error) {
    console.error("Error in create-order function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400, // Bad Request (or 500 for internal errors)
      }
    )
  }
})