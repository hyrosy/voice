// In supabase/functions/audo-webhook/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Note: No CORS needed here, as it's a server-to-server request

// Audo.ai's docs don't specify a signature, so we'll rely on the secret URL/key
// This is a basic implementation.

serve(async (req) => {
  // 1. Get Secrets
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing secrets for webhook");
    return new Response('Configuration error', { status: 500 });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // 2. Parse the body from Audo.ai
    const payload = await req.json();
    const { jobId, status, downloadUrl } = payload;

    if (!jobId) {
      throw new Error("Webhook payload missing 'jobId'");
    }

    console.log(`Webhook received for jobId: ${jobId}, status: ${status}`);

    // 3. Connect to Supabase
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 4. Update the database record based on the job status
    let updateData = {};

    if (status === 'succeeded') {
      if (!downloadUrl) throw new Error(`Job ${jobId} succeeded but has no downloadUrl`);
      updateData = {
        status: 'cleaned',
        cleaned_audio_url: downloadUrl
      };
      console.log(`Job ${jobId} succeeded. Updating DB with URL: ${downloadUrl}`);
    } else if (status === 'failed') {
      console.error(`Audo.ai job ${jobId} failed.`);
      updateData = { 
        status: 'error'
      };
    } else {
      console.log(`Ignoring status '${status}' for job ${jobId}`);
      return new Response('Acknowledged (no action)', { status: 200 });
    }

    // Find the record using the audo_job_id and update it
    const { error } = await supabaseAdmin
      .from('actor_recordings')
      .update(updateData)
      .eq('audo_job_id', jobId); // <-- This is why we saved the job ID

    if (error) {
      throw new Error(`Failed to update DB for jobId ${jobId}: ${error.message}`);
    }

    // 7. Return 200 OK to Audo.ai
    return new Response('Webhook processed successfully', { status: 200 });

  } catch (error) {
    console.error("Error in audo-webhook function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
})