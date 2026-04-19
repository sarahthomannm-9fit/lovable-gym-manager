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
      { email: 'roni.comercial19@gmail.com', password: '54996754' },
      { email: 'sarahthomannm@gmail.com', password: '54996754' },
    ];

    const results = [];

    for (const u of users) {
      // Try to find existing user
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find((x) => x.email === u.email);

      let userId: string;
      if (existing) {
        const { error } = await supabase.auth.admin.updateUserById(existing.id, {
          password: u.password,
          email_confirm: true,
        });
        if (error) throw error;
        userId = existing.id;
        results.push({ email: u.email, action: 'updated' });
      } else {
        const { data, error } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
        });
        if (error) throw error;
        userId = data.user!.id;
        results.push({ email: u.email, action: 'created' });
      }

      // Ensure admin role
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'admin',
      });
      if (roleError) throw roleError;
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
