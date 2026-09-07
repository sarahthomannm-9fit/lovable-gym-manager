import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AppRole = 'admin' | 'manager' | 'user' | 'sindico' | 'professor' | 'corporate';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth + admin check via caller's JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Não autenticado' }, 401);
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: 'Token inválido' }, 401);
    const callerId = claimsData.claims.sub as string;

    // Verify caller is admin
    const { data: isAdminData, error: isAdminErr } = await supabaseAuth.rpc('is_admin', { _user_id: callerId });
    if (isAdminErr || !isAdminData) return json({ error: 'Acesso negado' }, 403);

    // Service-role client for privileged ops
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    switch (action) {
      case 'list': {
        const { data: list, error } = await admin.auth.admin.listUsers();
        if (error) throw error;
        const ids = list.users.map((u) => u.id);
        const { data: roles } = await admin.from('user_roles').select('user_id, role').in('user_id', ids);
        const map = new Map((roles || []).map((r: any) => [r.user_id, r.role]));
        const users = list.users.map((u) => ({
          user_id: u.id,
          email: u.email,
          role: (map.get(u.id) as AppRole) || 'user',
        }));
        return json({ users });
      }

      case 'create': {
        const { email, password, role } = body as { email: string; password: string; role: AppRole };
        if (!email || !password) return json({ error: 'email e password obrigatórios' }, 400);
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email, password, email_confirm: true,
        });
        if (createErr) throw createErr;
        const userId = created.user!.id;
        const r: AppRole = (['admin', 'manager', 'user', 'sindico', 'professor', 'corporate'].includes(role) ? role : 'user') as AppRole;
        await admin.from('user_roles').delete().eq('user_id', userId);
        const { error: roleErr } = await admin.from('user_roles').insert({ user_id: userId, role: r });
        if (roleErr) throw roleErr;
        return json({ success: true, user_id: userId });
      }

      case 'create_for_organization': {
        const { email, password, role, organizationId, papel } = body as { email: string; password: string; role: AppRole; organizationId: string; papel: string };
        if (!email || !password || !organizationId) return json({ error: 'email, password e organizationId obrigatórios' }, 400);
        const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
        if (createErr) throw createErr;
        const userId = created.user!.id;
        const r: AppRole = (['admin', 'manager', 'user', 'sindico', 'professor', 'corporate'].includes(role) ? role : 'user') as AppRole;
        const { error: roleErr } = await admin.from('user_roles').insert({ user_id: userId, role: r });
        if (roleErr) throw roleErr;
        const { error: memberErr } = await admin.from('organization_members').insert({ organization_id: organizationId, user_id: userId, papel: papel || r });
        if (memberErr) throw memberErr;
        return json({ success: true, user_id: userId });
      }

      case 'delete': {
        const { userId } = body as { userId: string };
        if (!userId) return json({ error: 'userId obrigatório' }, 400);
        if (userId === callerId) return json({ error: 'Você não pode excluir a si mesmo' }, 400);
        await admin.from('user_roles').delete().eq('user_id', userId);
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) throw error;
        return json({ success: true });
      }

      case 'reset_password': {
        const { email, password } = body as { email: string; password: string };
        if (!email || !password) return json({ error: 'email e password obrigatórios' }, 400);
        const { data: list } = await admin.auth.admin.listUsers();
        const u = list?.users?.find((x) => x.email === email);
        if (!u) return json({ error: 'Usuário não encontrado' }, 404);
        const { error } = await admin.auth.admin.updateUserById(u.id, { password });
        if (error) throw error;
        return json({ success: true });
      }

      case 'set_role': {
        const { userId, role } = body as { userId: string; role: AppRole };
        if (!userId || !role) return json({ error: 'userId e role obrigatórios' }, 400);
        if (!['admin', 'manager', 'user', 'sindico', 'professor', 'corporate'].includes(role)) return json({ error: 'role inválido' }, 400);
        await admin.from('user_roles').delete().eq('user_id', userId);
        const { error } = await admin.from('user_roles').insert({ user_id: userId, role });
        if (error) throw error;
        return json({ success: true });
      }

      default:
        return json({ error: 'action inválida' }, 400);
    }
  } catch (err) {
    console.error('manage-users error:', err);
    return json({ error: String(err instanceof Error ? err.message : err) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

