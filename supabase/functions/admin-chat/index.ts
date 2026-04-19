import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleAuth } from "npm:google-auth-library"; // 🚀 Ditch Dialogflow SDK, use raw Google Auth

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const { session_id, message, context, files } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. SECURE AUTH
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header.");

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user || user.email !== "support@hyrosy.com") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. LOG USER MESSAGE
    await supabaseAdmin.from("admin_ai_messages").insert({
      session_id,
      role: "user",
      content: message,
      attachments: files || [],
    });

    // 3. FETCH HISTORY
    const { data: rawHistory } = await supabaseAdmin
      .from("admin_ai_messages")
      .select("role, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const history = rawHistory ? rawHistory.reverse() : [];

    const systemPrompt = `
      [CONTEXT] Page: ${
        context?.page || "Dashboard"
      } | Time: ${new Date().toISOString()}
      [HISTORY]
      ${history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}
      [USER]: ${message}
    `;

    // 4. GOOGLE CLOUD AUTHENTICATION (Generating a Bearer Token)
    const gcpKeyString = Deno.env.get("GCP_SERVICE_ACCOUNT_JSON");
    if (!gcpKeyString) throw new Error("GCP_SERVICE_ACCOUNT_JSON not set.");

    const credentials = JSON.parse(gcpKeyString);
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    }

    // 🚀 NEW: Authenticate manually for the CES REST API
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();

    // 5. CALL THE NEW CES API (Using your exact Deployment ID)
    // We extracted this directly from your HTML snippet!
    const DEPLOYMENT_NAME =
      "projects/637761060044/locations/us/apps/43a80e1b-388d-4b43-9d08-50472c018631/deployments/d2cdef67-4d08-4cca-a6b6-01f80d0a23be";
    const APP_ID = "43a80e1b-388d-4b43-9d08-50472c018631";

    const cesUrl = `https://ces.googleapis.com/v1/projects/637761060044/locations/us/apps/${APP_ID}/sessions/${session_id}:runSession`;

    const cesRes = await fetch(cesUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResponse.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: [
          {
            // 🚀 FIX: The CES API just wants a standard string here, not a nested object!
            text: systemPrompt,
            languageCode: "en",
          },
        ],
        config: {
          deployment: DEPLOYMENT_NAME,
        },
      }),
    });

    if (!cesRes.ok) {
      const errText = await cesRes.text();
      throw new Error(`CES API Error ${cesRes.status}: ${errText}`);
    }

    const response = await cesRes.json();

    // 6. PARSE RESPONSE
    let aiTextResponse = "";
    // 🚀 FIX: The new CES API uses "outputs" instead of "responseMessages"
    const outputs = response.outputs || [];

    for (const output of outputs) {
      if (output.text) {
        aiTextResponse += output.text + "\n\n";
      }
    }

    if (!aiTextResponse.trim()) {
      aiTextResponse =
        "Connected to CES successfully, but the Agent returned an empty text format. Raw output: " +
        JSON.stringify(response);
    }

    // 7. PERSIST & RESPOND
    await supabaseAdmin.from("admin_ai_messages").insert({
      session_id,
      role: "assistant",
      content: aiTextResponse.trim(),
    });

    return new Response(JSON.stringify({ reply: aiTextResponse.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[CRITICAL AI ERROR]:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
