import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const users = [
      { email: 'roni.comercial19@gmail.com', password: '54967554', nome: 'Roni' },
      { email: 'sarahthomannm@gmail.com', password: '54967554', nome: 'Sarah' },
    ];

    const results = [];
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, tipo')
      .in('tipo', ['condominio', 'corporate', 'professor', 'studio']);

    const papelByTipo: Record<string, string> = {
      condominio: 'sindico',
      corporate: 'corporate',
      professor: 'professor',
      studio: 'professor',
    };

    for (const u of users) {
      // Try to find existing user
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find((x) => x.email === u.email);

      let userId: string;
      if (existing) {
        const { error } = await supabase.auth.admin.updateUserById(existing.id, {
          password: u.password,
          email_confirm: true,
          user_metadata: { nome: u.nome },
        });
        if (error) throw error;
        userId = existing.id;
        results.push({ email: u.email, action: 'updated' });
      } else {
        const { data, error } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { nome: u.nome },
        });
        if (error) throw error;
        userId = data.user!.id;
        results.push({ email: u.email, action: 'created' });
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        nome: u.nome,
        email: u.email,
      });
      if (profileError) throw profileError;

      const { error: roleError } = await supabase.from('user_roles').upsert({
        user_id: userId,
        role: 'admin',
      }, { onConflict: 'user_id,role' });
      if (roleError) throw roleError;

      for (const org of orgs || []) {
        const { error: memberError } = await supabase.from('organization_members').upsert({
          user_id: userId,
          organization_id: org.id,
          papel: papelByTipo[org.tipo] || 'sindico',
        }, { onConflict: 'organization_id,user_id,papel' });
        if (memberError) throw memberError;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
