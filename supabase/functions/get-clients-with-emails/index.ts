import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts' // Assuming you create a shared CORS file (see below)

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("get-clients-with-emails function invoked.");

    // Create Supabase Admin Client (requires secrets to be set)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log("Supabase admin client initialized.");

    // Get the Authorization header to verify the caller.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    // Use the header to get the user making the request
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
        throw new Error(`Authentication error: ${userError?.message || 'User not found'}`);
    }
    console.log("Caller User ID:", user.id);

    // Verify the user is an admin by checking the 'actors' table
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

    // Fetch client profiles from public.clients
    const { data: clientsData, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id, full_name, company_name, user_id') // Fetch necessary client data
      .order('full_name', { ascending: true });

    if (clientsError) {
      throw clientsError;
    }
    console.log(`Fetched ${clientsData?.length || 0} client profiles.`);

    // If no clients, return empty array
    if (!clientsData || clientsData.length === 0) {
       return new Response(JSON.stringify([]), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 200,
       });
    }

    // Extract user_ids to fetch corresponding auth users
    const userIds = clientsData.map(c => c.user_id);

    // Fetch auth users using the Admin API (can only be done server-side)
    // Note: listUsers might require pagination for large numbers of users
    const { data: usersResponse, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
       page: 1,
       perPage: 1000, // Adjust if you have more clients
    });

    if (usersError) {
      throw usersError;
    }

    // Create a map of user_id -> email for easy lookup
    const emailMap: { [userId: string]: string } = {};
    usersResponse?.users.forEach(authUser => {
        if (authUser.email) { // Ensure email exists
           emailMap[authUser.id] = authUser.email;
        }
    });
    console.log("Created email map for fetched users.");


    // Combine client profiles with their emails
    const clientsWithEmails = clientsData.map(client => ({
      ...client,
      email: emailMap[client.user_id] || 'N/A (Email not found in Auth)', // Add email from map
    }));

    // Return the combined data
    return new Response(
      JSON.stringify(clientsWithEmails),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // OK
      }
    )
  } catch (error) {
    console.error("Error in get-clients-with-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        // Use 401 for Auth errors, 403 for Permission denied, 500 for others
        status: error.message.startsWith('Permission denied') ? 403 : error.message.startsWith('Authentication error') ? 401 : 500,
      }
    )
  }
})