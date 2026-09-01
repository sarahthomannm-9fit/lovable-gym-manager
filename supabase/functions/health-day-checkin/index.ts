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

    const { evento_id } = await req.json().catch(() => ({ evento_id: null }));
    if (!evento_id) {
      return new Response(JSON.stringify({ error: "missing evento_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // Resolve aluno linked to this user
    const { data: aluno, error: alunoErr } = await admin
      .from("alunos")
      .select("id, organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (alunoErr || !aluno) {
      return new Response(JSON.stringify({ error: "aluno not linked to user" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load event
    const { data: evento, error: eventoErr } = await admin
      .from("eventos_condominio")
      .select("id, nome, organization_id, vagas_totais, ativo, data_evento")
      .eq("id", evento_id)
      .maybeSingle();

    if (eventoErr || !evento) {
      return new Response(JSON.stringify({ error: "evento not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!evento.ativo) {
      return new Response(JSON.stringify({ status: "evento_inativo" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (evento.organization_id !== aluno.organization_id) {
      return new Response(JSON.stringify({ error: "evento does not belong to aluno organization" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already confirmed?
    const { data: existing } = await admin
      .from("health_day_inscricoes")
      .select("id, status")
      .eq("evento_id", evento_id)
      .eq("aluno_id", aluno.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ status: existing.status, ja_inscrito: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count confirmed spots (race-safe enough for this scale; unique constraint backstops it)
    const { count: confirmados, error: countErr } = await admin
      .from("health_day_inscricoes")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", evento_id)
      .eq("status", "confirmado");

    if (countErr) throw countErr;

    const vagasTotais = evento.vagas_totais;
    const semLimite = vagasTotais === null || vagasTotais === undefined;
    const temVaga = semLimite || (confirmados ?? 0) < vagasTotais;

    if (!temVaga) {
      return new Response(JSON.stringify({ status: "sem_vaga", evento: { id: evento.id, nome: evento.nome, data_evento: evento.data_evento } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inscricao, error: insErr } = await admin
      .from("health_day_inscricoes")
      .insert({ evento_id, aluno_id: aluno.id, status: "confirmado" })
      .select("id, status")
      .single();

    // Unique violation = someone else took the last spot in a race; treat as sem_vaga
    if (insErr) {
      if ((insErr as { code?: string }).code === "23505") {
        return new Response(JSON.stringify({ status: "sem_vaga" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw insErr;
    }

    return new Response(JSON.stringify({ status: "confirmado", inscricao }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("health-day-checkin error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
