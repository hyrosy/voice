// In supabase/functions/_shared/cors.ts

// Define your allowed origins
const allowedOrigins = [
  'http://localhost:5173',    // Your local dev environment
  'https://www.ucpmaroc.com',  // Your production site
];

export const corsHeaders = (origin: string | null) => {
  // Check if the request's origin is in our allowed list
  const inAllowedList = origin ? allowedOrigins.includes(origin) : false;
  
  // If it is, allow it. If not, default to your main production site.
  const accessControlAllowOrigin = inAllowedList ? origin : allowedOrigins[1];

  return {
    'Access-Control-Allow-Origin': accessControlAllowOrigin!,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS' // <-- **Add this line**
  };
};