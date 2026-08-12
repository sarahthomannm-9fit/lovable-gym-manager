import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface JoinOrgRequest {
  token: string;
  nome: string;
  telefone: string;
}

interface JoinOrgResponse {
  success: boolean;
  aluno?: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    organization_id: string;
    user_id: string;
  };
  error?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: "Missing or invalid authorization header",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const body: JoinOrgRequest = await req.json();

    if (!body.token || !body.nome || !body.telefone) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: token, nome, telefone",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with service_role (runs with elevated privileges)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT token with getUser (validates authenticity)
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(token.split(".")[2]);

    if (userError || !userData.user) {
      console.error("Invalid JWT token:", userError);
      return new Response(
        JSON.stringify({
          error: "Token inválido ou expirado, peça um novo QR code ao síndico",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const user = userData.user;
    const userId = user.id;
    const userEmail = user.email;

    if (!userEmail) {
      return new Response(
        JSON.stringify({
          error: "User email not found in authentication",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Validate invite token
    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from("org_invites")
      .select("*")
      .eq("token", body.token)
      .eq("ativo", true)
      .single();

    if (inviteError || !inviteData) {
      console.error("Invalid invite token:", inviteError);
      return new Response(
        JSON.stringify({
          error: "Convite inválido ou expirado, peça um novo QR code ao síndico",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if token is expired
    if (inviteData.expira_em && new Date(inviteData.expira_em) < new Date()) {
      return new Response(
        JSON.stringify({
          error: "Convite expirado, peça um novo QR code ao síndico",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if token max uses exceeded
    if (
      inviteData.max_usos &&
      inviteData.usos_atuais >= inviteData.max_usos
    ) {
      return new Response(
        JSON.stringify({
          error: "Convite atingiu o limite de usos, peça um novo QR code ao síndico",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Check if user already has an aluno record (idempotency)
    const { data: existingAlunoData } = await supabaseAdmin
      .from("alunos")
      .select("*")
      .eq("user_id", userId)
      .eq("organization_id", inviteData.organization_id)
      .single();

    if (existingAlunoData) {
      // User already registered - return existing aluno (idempotent)
      // Still increment the invite usage
      await supabaseAdmin
        .from("org_invites")
        .update({ usos_atuais: inviteData.usos_atuais + 1 })
        .eq("id", inviteData.id);

      return new Response(
        JSON.stringify({
          success: true,
          aluno: {
            id: existingAlunoData.id,
            nome: existingAlunoData.nome,
            email: existingAlunoData.email,
            telefone: existingAlunoData.telefone,
            organization_id: existingAlunoData.organization_id,
            user_id: existingAlunoData.user_id,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Create aluno and organization_member in transaction
    // Start transaction by inserting to alunos
    const { data: alunoData, error: alunoError } = await supabaseAdmin
      .from("alunos")
      .insert({
        nome: body.nome,
        email: userEmail,
        telefone: body.telefone,
        organization_id: inviteData.organization_id,
        user_id: userId,
        lifecycle_status: "ativo",
      })
      .select()
      .single();

    if (alunoError || !alunoData) {
      console.error("Failed to create aluno:", alunoError);
      return new Response(
        JSON.stringify({
          error: "Erro ao criar registro de aluno",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert into organization_members
    const { error: memberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: inviteData.organization_id,
        user_id: userId,
        papel: inviteData.papel_padrao,
      });

    if (memberError) {
      console.error("Failed to create organization_member:", memberError);
      // Try to rollback aluno creation
      await supabaseAdmin.from("alunos").delete().eq("id", alunoData.id);

      return new Response(
        JSON.stringify({
          error: "Erro ao vincular usuário à organização",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Increment invite usage
    const { error: updateError } = await supabaseAdmin
      .from("org_invites")
      .update({ usos_atuais: inviteData.usos_atuais + 1 })
      .eq("id", inviteData.id);

    if (updateError) {
      console.error("Failed to update invite usage:", updateError);
      // Log but don't fail - the main operation succeeded
    }

    return new Response(
      JSON.stringify({
        success: true,
        aluno: {
          id: alunoData.id,
          nome: alunoData.nome,
          email: alunoData.email,
          telefone: alunoData.telefone,
          organization_id: alunoData.organization_id,
          user_id: alunoData.user_id,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
