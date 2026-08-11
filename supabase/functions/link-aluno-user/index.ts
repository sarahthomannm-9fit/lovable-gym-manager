import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "missing token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Validate the caller's token — identity comes only from here
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already linked?
    const { data: linked } = await admin
      .from("alunos")
      .select("id, nome, email, organization_id, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (linked) {
      return new Response(JSON.stringify({ aluno: linked, linked: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = (user.email || "").trim().toLowerCase();
    if (!email) {
      return new Response(JSON.stringify({ aluno: null, linked: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Match an unlinked aluno record by email (case-insensitive)
    const { data: candidate } = await admin
      .from("alunos")
      .select("id, nome, email, organization_id, user_id")
      .ilike("email", email)
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!candidate) {
      return new Response(JSON.stringify({ aluno: null, linked: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: updated, error: updErr } = await admin
      .from("alunos")
      .update({ user_id: user.id })
      .eq("id", candidate.id)
      .is("user_id", null)
      .select("id, nome, email, organization_id, user_id")
      .maybeSingle();

    if (updErr) throw updErr;

    return new Response(JSON.stringify({ aluno: updated ?? candidate, linked: !!updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("link-aluno-user error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
