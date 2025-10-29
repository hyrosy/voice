// In supabase/functions/_shared/cors.ts

const allowedOrigins = [
  'http://localhost:5173',      // Your local dev environment
  'https://www.ucpmaroc.com',   // Your production site
];

export const corsHeaders = (origin: string | null) => {
  const inAllowedList = origin ? allowedOrigins.includes(origin) : false;
  const accessControlAllowOrigin = inAllowedList ? origin : allowedOrigins[1]; // Default to production

  return {
    'Access-Control-Allow-Origin': accessControlAllowOrigin!,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  };
};