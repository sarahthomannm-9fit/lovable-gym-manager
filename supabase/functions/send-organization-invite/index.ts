import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return new Response(JSON.stringify({error:'Não autenticado'}),{status:401,headers:{...cors,'Content-Type':'application/json'}});
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const adminDb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({error:'Sessão inválida'}),{status:401,headers:{...cors,'Content-Type':'application/json'}});

    const { inviteId, token, email, papel } = await req.json();
    if (!inviteId || !token || !email) throw new Error('Dados do convite incompletos');
    const { data: admin } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!admin) throw new Error('Sem permissão para enviar convite');

    const {data:stored,error:inviteError}=await adminDb.from('organization_invites').select('token,email,status,expires_at,papel').eq('id',inviteId).single();
    if(inviteError||!stored||stored.token!==token||stored.email.toLowerCase()!==String(email).toLowerCase()||stored.status!=='pendente'||new Date(stored.expires_at)<=new Date())throw new Error('Convite inválido ou expirado');

    const appUrl = Deno.env.get('APP_URL') || 'https://lovable-gym-manager.lovable.app';
    if(Deno.env.get('APP_ENV')==='staging'&&!Deno.env.get('APP_URL'))throw new Error('Configure APP_URL do ambiente de staging');
    const inviteUrl = `${appUrl.replace(/\/$/, '')}/convite/${token}`;
    const apiKey = Deno.env.get('RESEND_API_KEY');
    const from = Deno.env.get('RESEND_FROM_EMAIL');
    const sink=Deno.env.get('QA_EMAIL_SINK');
    if(Deno.env.get('APP_ENV')==='staging'&&!sink)throw new Error('Staging exige QA_EMAIL_SINK; nenhum e-mail foi enviado.');
    if (!apiKey || !from) {
      await adminDb.from('organization_invite_deliveries').insert({ invite_id: inviteId, status: 'not_configured', error: 'RESEND_API_KEY ou RESEND_FROM_EMAIL ausente' });
      return new Response(JSON.stringify({ sent: false, reason: 'email_provider_not_configured', inviteUrl }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json','Idempotency-Key':'nine-invite-'+inviteId }, body: JSON.stringify({ from, to: [Deno.env.get('APP_ENV')==='staging'?sink:stored.email], subject: `Seu acesso ao Nine Living — ${stored.papel === 'professor' ? 'Coach' : stored.papel === 'sindico' ? 'Síndico' : 'Morador'}`, html: `<p>Seu acesso ao Nine Living foi preparado.</p><p><a href="${inviteUrl}">Entrar no Manager</a></p><p>Se você ainda não possui conta, solicite ao administrador o cadastro do seu acesso.</p>` }) });
    if (!response.ok) {
      const errorText = 'Falha no provedor de e-mail (HTTP '+response.status+')';
      await adminDb.from('organization_invite_deliveries').insert({ invite_id: inviteId, status: 'failed', error: errorText });
      throw new Error(`Falha no provedor de e-mail: ${errorText}`);
    }
    const result = await response.json();
    await adminDb.from('organization_invite_deliveries').insert({ invite_id: inviteId, status: 'sent', message_id: result.id, sent_at: new Date().toISOString() });
    return new Response(JSON.stringify({ sent: true, inviteUrl, messageId: result.id }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Falha ao enviar convite' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
