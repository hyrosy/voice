import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SessionsClient } from "npm:@google-cloud/dialogflow-cx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS for React Frontend
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_id, message, context, files } = await req.json();

    // 1. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get("VITE_SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. AUTHENTICATION & RULE #1 STRICT SECURITY
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) throw new Error("Unauthorized");

    // BOUNCER: Kick out anyone who is not the master developer
    if (user.email !== "support@hyrosy.com") {
      return new Response(
        JSON.stringify({
          error:
            "Access Denied: This God Mode AI is restricted to the Lead Developer.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Save User Message to DB
    await supabaseAdmin.from("admin_ai_messages").insert({
      session_id: session_id,
      role: "user",
      content: message,
      attachments: files || [], // Save any uploaded files (Rule 5)
    });

    // 4. RULE #3: INFINITE MEMORY - Fetch entire chat history
    const { data: history, error: historyError } = await supabaseAdmin
      .from("admin_ai_messages")
      .select("role, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true });

    if (historyError) throw historyError;

    // 5. Build the Context-Aware Prompt (Rule #4)
    let aiPrompt = "=== SYSTEM CONTEXT ===\n";
    aiPrompt += `The user is currently looking at this page: ${
      context?.page || "Unknown"
    }\n`;
    aiPrompt +=
      "If they say 'this page', they are referring to the URL above.\n\n";

    aiPrompt += "=== PREVIOUS CHAT HISTORY ===\n";
    history.forEach((msg) => {
      aiPrompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    });

    aiPrompt += "=============================\n";
    aiPrompt += `USER'S NEW MESSAGE: ${message}`;

    // NOTE on Rule #5 (Images): Dialogflow CX currently processes text. To process images
    // natively with Gemini via this SDK, we pass the Base64 image data or Cloud Storage URI
    // as a session parameter, which the Vertex AI Data Store can read.
    const parameters =
      files && files.length > 0
        ? {
            uploaded_files: files, // Passing files to the agent's internal memory
          }
        : undefined;

    // 6. Connect to Google Cloud Vertex AI
    const credentials = JSON.parse(
      Deno.env.get("GCP_SERVICE_ACCOUNT_JSON") ?? "{}"
    );
    const gcpClient = new SessionsClient({ credentials });

    // UPDATE THESE 3 VARIABLES TO MATCH YOUR PROJECT
    const projectId = "stately-magpie-489319-d4";
    const location = "us"; // or 'global', 'us-central1'
    const agentId = "43a80e1b-388d-4b43-9d08-50472c018631";

    const sessionPath = gcpClient.projectLocationAgentSessionPath(
      projectId,
      location,
      agentId,
      session_id
    );

    // 7. Send the massive contextual payload to Google Cloud
    const request = {
      session: sessionPath,
      queryInput: {
        text: { text: aiPrompt },
        languageCode: "en",
      },
      queryParams: {
        parameters: parameters, // Injects files and metadata secretly
      },
    };

    const [response] = await gcpClient.detectIntent(request);

    // Vertex AI Agent Builder sometimes puts the response in different properties!
    const messages = response.queryResult?.responseMessages || [];
    let aiTextResponse = "";

    for (const msg of messages) {
      if (msg.text && msg.text.text && msg.text.text.length > 0) {
        aiTextResponse += msg.text.text[0] + "\n";
      } else if (
        msg.payload &&
        msg.payload.fields &&
        msg.payload.fields.richContent
      ) {
        // Fallback for Agent Builder rich responses
        aiTextResponse += JSON.stringify(msg.payload.fields.richContent) + "\n";
      }
    }

    if (!aiTextResponse.trim()) {
      aiTextResponse =
        "I connected to Google Cloud successfully, but the Agent returned an empty text response format. Raw output: " +
        JSON.stringify(response.queryResult);
    }

    // 8. Save AI Response to Database
    await supabaseAdmin.from("admin_ai_messages").insert({
      session_id: session_id,
      role: "assistant",
      content: aiTextResponse,
    });

    // 9. Send success back to React!
    return new Response(JSON.stringify({ reply: aiTextResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
