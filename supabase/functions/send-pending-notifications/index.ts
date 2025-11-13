// In supabase/functions/send-pending-notifications/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// --- IMPORTANT: Environment Variables ---
// Get these from your Supabase Project Settings > API
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Get these from your EmailJS Account (Account > API Keys)
// Store them in Supabase Project Settings > Secrets
const emailJsServiceId = Deno.env.get('EMAILJS_SERVICE_ID')!
const emailJsTemplateId = Deno.env.get('EMAILJS_NEW_MESSAGE_TEMPLATE_ID')! // Your "New Message" template
const emailJsUserId = Deno.env.get('EMAILJS_USER_ID')! // Your Public Key
const emailJsAccessToken = Deno.env.get('EMAILJS_ACCESS_TOKEN')! // Your Private Key

// This is the EmailJS API endpoint
const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send'

Deno.serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  try {
    const now = new Date().toISOString()

    // 1. Find all orders with notifications that are due
    const { data: orders, error: queryError } = await supabase
      .from('orders')
      .select(`
        id,
        order_id_string,
        client_name,
        client_email,
        last_message_sender_role,
        actors ( ActorName, ActorEmail )
      `)
      .lt('notification_due_at', now) // Where time is in the past
      .not('notification_due_at', 'is', null) // And not null

    if (queryError) throw queryError

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending notifications.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const processedOrders = []
    
    // 2. Loop through each order and send the email
    for (const order of orders) {
      const senderRole = order.last_message_sender_role
      const recipientIsActor = senderRole === 'client'
      
      const actor = Array.isArray(order.actors) ? order.actors[0] : order.actors
      
      const recipientName = recipientIsActor ? actor.ActorName : order.client_name
      const recipientEmail = recipientIsActor ? actor.ActorEmail : order.client_email
      const senderName = recipientIsActor ? order.client_name : actor.ActorName

      // Don't send if there's no email
      if (!recipientEmail) {
        console.warn(`Skipping order ${order.id}: no recipient email.`)
        processedOrders.push(order.id)
        continue;
      }

      // 3. Prepare EmailJS API payload
      const emailParams = {
        orderId: order.order_id_string,
        order_uuid: order.id,
        senderName: senderName,
        recipientName: recipientName,
        recipientEmail: recipientEmail,
      }

      const apiPayload = {
        service_id: emailJsServiceId,
        template_id: emailJsTemplateId,
        user_id: emailJsUserId,
        template_params: emailParams,
        accessToken: emailJsAccessToken, // This is the private key
      }

      // 4. Send the email by calling the EmailJS API
      const emailResponse = await fetch(EMAILJS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error(`Failed to send email for order ${order.id}: ${errorText}`)
        // Don't re-throw; we still want to update the DB to prevent spam
      } else {
        console.log(`Sent notification for order ${order.id} to ${recipientEmail}`)
      }
      
      processedOrders.push(order.id)
    }

    // 5. Clear the 'notification_due_at' field for all processed orders
    if (processedOrders.length > 0) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ notification_due_at: null })
        .in('id', processedOrders)

      if (updateError) {
        console.error('Error clearing processed notifications:', updateError)
      }
    }

    return new Response(JSON.stringify({ message: `Processed ${processedOrders.length} notifications.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})