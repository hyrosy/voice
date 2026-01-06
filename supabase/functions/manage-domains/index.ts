import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1. Authorize User
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { action, domain, portfolioId } = await req.json()
    
    // Vercel Config
    const VERCEL_TOKEN = Deno.env.get('VERCEL_API_TOKEN')
    const PROJECT_ID = Deno.env.get('VERCEL_PROJECT_ID')
    const TEAM_ID = Deno.env.get('VERCEL_TEAM_ID')
    
    const qs = TEAM_ID ? `?teamId=${TEAM_ID}` : ''

    // --- ACTION: ADD DOMAIN ---
    if (action === 'add') {
      if (!domain) throw new Error('Domain is required')

      // A. Call Vercel API to add domain
      const response = await fetch(
        `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains${qs}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
          body: JSON.stringify({ name: domain })
        }
      )
      
      const data = await response.json()
      
      if (data.error) {
        return new Response(JSON.stringify({ error: data.error.message }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        })
      }

      // B. Save to Database
      await supabase
        .from('portfolios')
        .update({ custom_domain: domain })
        .eq('id', portfolioId)
        .eq('actor_id', user.id)

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- ACTION: CHECK STATUS ---
    if (action === 'check') {
      if (!domain) throw new Error('Domain is required')

      // Get Domain Config (to see if verified)
      const configRes = await fetch(
        `https://api.vercel.com/v6/domains/${domain}/config${qs}`,
        { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
      )
      const config = await configRes.json()

      // Get Domain Status (DNS match?)
      const verifyRes = await fetch(
        `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${domain}${qs}`,
        { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
      )
      const verify = await verifyRes.json()

      return new Response(JSON.stringify({ 
        configured: !config.misconfigured,
        verified: verify.verified,
        verificationResponse: verify.verification
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- ACTION: REMOVE DOMAIN ---
    if (action === 'remove') {
       if (!domain) throw new Error('Domain is required')
       
       await fetch(
        `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${domain}${qs}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
        }
      )

      await supabase
        .from('portfolios')
        .update({ custom_domain: null })
        .eq('id', portfolioId)
        .eq('actor_id', user.id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})