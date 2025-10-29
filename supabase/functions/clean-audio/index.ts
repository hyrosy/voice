// In supabase/functions/clean-audio/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  recordingId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recordingId } = await req.json() as RequestBody;
    if (!recordingId) throw new Error('Missing recordingId');

    // 1. Get Secrets
    const AUDO_API_KEY = Deno.env.get('AUDO_API_KEY');
    if (!AUDO_API_KEY) throw new Error('Missing AUDO_API_KEY secret');
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Missing Supabase secrets');

    // 2. Create Supabase Admin Client
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 3. Verify User & Get Recording
    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('User not authenticated');

    const { data: actor } = await supabaseAdmin
      .from('actors')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (!actor) throw new Error('Actor profile not found');

    const { data: recording, error: recError } = await supabaseAdmin
      .from('actor_recordings')
      .select('id, raw_audio_url, status')
      .eq('id', recordingId)
      .eq('actor_id', actor.id)
      .single();

    if (recError || !recording) throw new Error('Recording not found or permission denied');
    if (recording.status === 'cleaning') throw new Error('Audio is already being cleaned');

    // 4. Set Status to 'cleaning'
    await supabaseAdmin
      .from('actor_recordings')
      .update({ status: 'cleaning' })
      .eq('id', recordingId);

    // --- 5. Audo.ai API Call ---
    
    // 5a. Fetch the raw audio file from Supabase Storage
    const audioResponse = await fetch(recording.raw_audio_url);
    if (!audioResponse.ok) throw new Error('Could not fetch raw audio file from storage');
    const audioBlob = await audioResponse.blob();
    const originalFileName = recording.raw_audio_url.split('/').pop() || 'recording.webm';

    // 5b. Prepare FormData for Audo.ai
    const formData = new FormData();
    formData.append('file', audioBlob, originalFileName);
    formData.append('apiKey', AUDO_API_KEY);

    // 5c. Call Audo.ai 'remove-noise' endpoint
    console.log(`Sending ${originalFileName} to Audo.ai...`);
    const audoResponse = await fetch('https://api.audo.ai/v1/remove-noise', {
      method: 'POST',
      body: formData,
    });

    if (!audoResponse.ok) {
      const errorText = await audoResponse.text();
      throw new Error(`Audo.ai API error: ${audoResponse.status} ${errorText}`);
    }

    // 5d. Get the cleaned audio file as a blob
    const cleanedAudioBlob = await audoResponse.blob();
    console.log("Received cleaned audio from Audo.ai");

    // --- 6. Upload Cleaned File to Supabase Storage ---
    
    // Create a new, unique path for the cleaned file
    const cleanedFilePath = `${actor.id}/cleaned-${Date.now()}-${originalFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('recordings') // Uploading back to the 'recordings' bucket
      .upload(cleanedFilePath, cleanedAudioBlob, {
        contentType: cleanedAudioBlob.type || 'audio/webm',
        upsert: false
      });
    
    if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);

    // 7. Get Public URL for the new cleaned file
    const { data: urlData } = supabaseAdmin.storage
      .from('recordings')
      .getPublicUrl(cleanedFilePath);
    
    const cleanedUrl = urlData.publicUrl;
    console.log("Cleaned file uploaded to:", cleanedUrl);

    // 8. Update the recording row with the cleaned URL and 'cleaned' status
    const { data: finalRecording, error: updateError } = await supabaseAdmin
      .from('actor_recordings')
      .update({
        cleaned_audio_url: cleanedUrl,
        status: 'cleaned'
      })
      .eq('id', recordingId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // 9. Return the final, updated recording object
    return new Response(JSON.stringify(finalRecording), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // If something fails, try to set status to 'error'
    try {
      const { recordingId } = await req.json();
      if (recordingId) {
        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
        await supabaseAdmin
          .from('actor_recordings')
          .update({ status: 'error' })
          .eq('id', recordingId);
      }
    } catch (e) {
      // Ignore errors during error handling
    }
    
    console.error("Error in clean-audio function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})