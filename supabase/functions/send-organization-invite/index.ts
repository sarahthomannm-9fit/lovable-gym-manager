import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) throw new Error('Não autenticado');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { inviteId, token, email, papel } = await req.json();
    if (!inviteId || !token || !email) throw new Error('Dados do convite incompletos');
    const { data: admin } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!admin) throw new Error('Sem permissão para enviar convite');

    const appUrl = Deno.env.get('APP_URL') || req.headers.get('origin') || 'https://lovable-gym-manager.lovable.app';
    const inviteUrl = `${appUrl.replace(/\/$/, '')}/convite/${token}`;
    const apiKey = Deno.env.get('RESEND_API_KEY');
    const from = Deno.env.get('RESEND_FROM_EMAIL');
    if (!apiKey || !from) return new Response(JSON.stringify({ sent: false, reason: 'email_provider_not_configured', inviteUrl }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });

    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [email], subject: `Seu acesso ao Nine Living — ${papel === 'professor' ? 'Coach' : papel === 'sindico' ? 'Síndico' : 'Morador'}`, html: `<p>Seu acesso ao Nine Living foi preparado.</p><p><a href="${inviteUrl}">Entrar no Manager</a></p><p>Se você ainda não possui conta, solicite ao administrador o cadastro do seu acesso.</p>` }) });
    if (!response.ok) throw new Error(`Falha no provedor de e-mail: ${await response.text()}`);
    return new Response(JSON.stringify({ sent: true, inviteUrl }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Falha ao enviar convite' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});

