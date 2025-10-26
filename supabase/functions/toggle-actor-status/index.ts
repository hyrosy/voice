import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts' // Use the shared CORS file

interface RequestBody {
  actorId: string;
  newStatus: boolean; // Expecting true for active, false for inactive
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("toggle-actor-status function invoked.");

    // Create Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log("Supabase admin client initialized.");

    // Verify Caller is Admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error(`Authentication error: ${userError?.message || 'User not found'}`);
    console.log("Caller User ID:", user.id);

    const { data: adminProfile, error: adminCheckError } = await supabaseAdmin
      .from('actors')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (adminCheckError || adminProfile?.role !== 'admin') {
        console.warn(`Admin check failed for user ${user.id}:`, adminCheckError);
        throw new Error('Permission denied: User is not an admin.');
    }
    console.log("Admin role verified.");

    // Get actorId and newStatus from request body
    const { actorId, newStatus } = await req.json() as RequestBody;
    console.log(`Request to set actor ${actorId} status to ${newStatus}`);

    // Validate input
    if (!actorId || typeof newStatus !== 'boolean') {
      throw new Error('Invalid input: actorId (string) and newStatus (boolean) are required.');
    }

    // Perform the update using Admin Client (bypasses RLS)
    const { data: updatedActor, error: updateError } = await supabaseAdmin
      .from('actors')
      .update({ IsActive: newStatus }) // Column name might need quotes if case-sensitive: "IsActive"
      .eq('id', actorId)
      .select('id, "IsActive"') // Select updated status
      .single();

    if (updateError) {
      console.error(`Error updating actor ${actorId}:`, updateError);
      throw updateError;
    }

    if (!updatedActor) {
        throw new Error(`Actor with ID ${actorId} not found or update failed.`);
    }

    console.log(`Actor ${actorId} status updated successfully to ${updatedActor.IsActive}.`);

    // Return success response
    return new Response(
      JSON.stringify({ success: true, actorId: updatedActor.id, isActive: updatedActor.IsActive }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in toggle-actor-status function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.startsWith('Permission denied') ? 403 : error.message.startsWith('Authentication error') ? 401 : 500, // More specific status codes
      }
    )
  }
})