import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SessionsClient } from "npm:@google-cloud/dialogflow-cx";

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

    // 4. GOOGLE CLOUD INITIALIZATION
    const gcpKeyString = Deno.env.get("GCP_SERVICE_ACCOUNT_JSON");
    if (!gcpKeyString) throw new Error("GCP_SERVICE_ACCOUNT_JSON not set.");

    const credentials = JSON.parse(gcpKeyString);
    // Fix private key formatting
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    }

    // Initialize Client with fallback: true for Edge compatibility
    const gcpClient = new SessionsClient({
      credentials,
      fallback: true,
      apiEndpoint: "us-dialogflow.googleapis.com", // 🚀 ADD THIS ONE LINE!
    });

    const sessionPath = gcpClient.projectLocationAgentSessionPath(
      "stately-magpie-489319-d4",
      "us",
      "43a80e1b-388d-4b43-9d08-50472c018631",
      session_id
    );

    const [response] = await gcpClient.detectIntent({
      session: sessionPath,
      queryInput: {
        text: { text: systemPrompt },
        languageCode: "en",
      },
      queryParams: {
        parameters: files?.length ? { uploaded_files: files } : undefined,
      },
    });

    // 5. PARSE RESPONSE
    let aiTextResponse = "";
    const responseMessages = response.queryResult?.responseMessages || [];

    for (const msg of responseMessages) {
      if (msg.text?.text?.[0]) {
        aiTextResponse += msg.text.text[0] + "\n";
      } else if (msg.payload) {
        aiTextResponse += JSON.stringify(msg.payload) + "\n";
      }
    }

    if (!aiTextResponse.trim()) {
      aiTextResponse =
        "Connected to Google Cloud successfully, but the Agent returned an empty text format.";
    }

    // 6. PERSIST & RESPOND
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
