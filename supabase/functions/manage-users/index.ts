import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AppRole = 'admin' | 'manager' | 'user';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: 'Token inválido' }, 401);
    const callerId = userData.user.id;

    const { data: isAdminData, error: isAdminErr } = await supabaseAuth.rpc('is_admin', { _user_id: callerId });
    if (isAdminErr || !isAdminData) return json({ error: 'Acesso negado' }, 403);

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
        const r: AppRole = (['admin', 'manager', 'user'].includes(role) ? role : 'user') as AppRole;
        await admin.from('user_roles').delete().eq('user_id', userId);
        const { error: roleErr } = await admin.from('user_roles').insert({ user_id: userId, role: r });
        if (roleErr) throw roleErr;
        return json({ success: true, user_id: userId });
      }

      // Cria a conta de login E já vincula a um cadastro de aluno existente,
      // num único passo. Resolve o gap onde um aluno cadastrado (alunos.user_id
      // NULL) nunca ganhava acesso de login — hoje isso exigia dois passos manuais
      // separados (criar usuário em manage-users, depois vincular via
      // link-aluno-user), e o segundo passo dependia do e-mail do aluno bater
      // exatamente com o e-mail da nova conta, sem confirmação explícita.
      case 'create_and_link_aluno': {
        const { alunoId, password, role } = body as { alunoId: string; password: string; role?: AppRole };
        if (!alunoId || !password) return json({ error: 'alunoId e password obrigatórios' }, 400);

        const { data: aluno, error: alunoErr } = await admin
          .from('alunos')
          .select('id, nome, email, user_id')
          .eq('id', alunoId)
          .maybeSingle();
        if (alunoErr) throw alunoErr;
        if (!aluno) return json({ error: 'Aluno não encontrado' }, 404);
        if (aluno.user_id) return json({ error: 'Este aluno já tem uma conta de acesso vinculada' }, 400);
        if (!aluno.email) return json({ error: 'Aluno não tem e-mail cadastrado — cadastre um e-mail antes de criar o acesso' }, 400);

        const email = aluno.email.trim().toLowerCase();

        // Reaproveita conta existente com esse e-mail, se houver (evita erro
        // "already registered" e cobre o caso de a conta já existir mas nunca
        // ter sido vinculada).
        const { data: existingList } = await admin.auth.admin.listUsers();
        let userId = existingList?.users?.find((u) => u.email?.toLowerCase() === email)?.id;

        if (!userId) {
          const { data: created, error: createErr } = await admin.auth.admin.createUser({
            email, password, email_confirm: true,
          });
          if (createErr) throw createErr;
          userId = created.user!.id;
        }

        const r: AppRole = (['admin', 'manager', 'user'].includes(role || '') ? role : 'user') as AppRole;
        await admin.from('user_roles').delete().eq('user_id', userId);
        const { error: roleErr } = await admin.from('user_roles').insert({ user_id: userId, role: r });
        if (roleErr) throw roleErr;

        const { data: linked, error: linkErr } = await admin
          .from('alunos')
          .update({ user_id: userId })
          .eq('id', alunoId)
          .is('user_id', null)
          .select('id, nome, email, user_id')
          .maybeSingle();
        if (linkErr) throw linkErr;
        if (!linked) return json({ error: 'Falha ao vincular — o aluno pode já ter sido vinculado por outra ação' }, 409);

        return json({ success: true, user_id: userId, aluno: linked });
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
        if (!['admin', 'manager', 'user'].includes(role)) return json({ error: 'role inválido' }, 400);
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
