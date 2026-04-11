import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Confirm user email
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    "b4887bc1-8dee-4146-8948-f519c6b637dd",
    { email_confirm: true }
  );

  return new Response(JSON.stringify({ success: !error, error: error?.message }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
