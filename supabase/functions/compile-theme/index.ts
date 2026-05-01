import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// 🚀 We load Babel on the server!
import * as Babel from "https://esm.sh/@babel/standalone@7.23.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { theme_id } = await req.json();
    if (!theme_id) throw new Error("theme_id is required");

    // 1. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Fetch the raw code (files)
    const { data: theme, error: fetchError } = await supabaseAdmin
      .from('marketplace_themes')
      .select('files, status')
      .eq('id', theme_id)
      .single();

    if (fetchError || !theme) throw new Error("Theme not found");

    const compiledBundle: Record<string, string> = {};

    // 3. Compile the code on the Edge!
    Object.entries(theme.files).forEach(([filename, code]) => {
      if (!filename.endsWith('.tsx') && !filename.endsWith('.jsx')) return;

      // Transform JSX/TSX into pure JavaScript
      const result = Babel.transform(code as string, {
        presets: ["react", "env", "typescript"],
        filename,
        minified: true, // Minify to save database space and network transfer!
      });

      if (result?.code) {
        // Save without the extension (e.g., 'Hero')
        const compName = filename.replace(/\.(tsx|jsx|ts|js)$/, '');
        compiledBundle[compName] = result.code;
      }
    });

    // 4. Save the compiled bundle back to the database
    // Optionally, you can also set status to 'approved' here if this is part of your admin flow!
    const { error: updateError } = await supabaseAdmin
      .from('marketplace_themes')
      .update({ 
          compiled_bundle: compiledBundle,
          status: 'approved' // Automatically approve it upon successful compilation
      })
      .eq('id', theme_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, message: "Theme compiled successfully!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Compilation Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});