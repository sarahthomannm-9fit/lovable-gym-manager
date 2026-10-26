import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return json({error:'Método inválido'},405);
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
 try{
  const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');
  if(!token)return json({error:'Entre novamente'},401);
  const {data:identity,error:identityError}=await db.auth.getUser(token);
  if(identityError||!identity.user)return json({error:'Sessão inválida'},401);
  const body=await req.json();
  const base=Deno.env.get('STAFF_API_URL') || 'https://xtexysqtfsofdohujtfr.supabase.co/functions/v1/staff-api';
  const key=Deno.env.get('FITPRO_API_KEY');
  if(Deno.env.get('APP_ENV')==='staging'&&(!Deno.env.get('STAFF_API_URL')||base.includes('xtexysqtfsofdohujtfr')))return json({error:'Configure STAFF_API_URL de um ambiente segregado; nenhuma reserva foi enviada.'},503);
  if(body.action==='status')return json({configured:!!key});
  const {data:student,error:studentError}=await db.from('alunos').select('id,nome,email,telefone,organization_id').eq('id',body.aluno_id).eq('user_id',identity.user.id).single();
  if(studentError||!student)return json({error:'Cadastro de morador não vinculado'},403);
  if(body.action==='refresh'){
   const {data:requests,error}=await db.from('professional_booking_requests').select('*').eq('aluno_id',student.id);
   if(error)throw error;
   for(const request of requests || []){
    let externalId=request.external_id;
    if(!externalId&&request.status==='unknown'&&key){
     const response=await fetch(base+'/bookings?client_id='+encodeURIComponent(student.id),{headers:{'x-fitpro-key':key},signal:AbortSignal.timeout(15000)});
     if(response.ok){const data=await response.json();externalId=data.bookings?.find((r:{external_ref?:string})=>r.external_ref===request.id)?.id;
      if(externalId){const {error}=await db.rpc('finish_professional_booking',{p_id:request.id,p_external:externalId,p_error:null,p_refund:false});if(error)throw error;}}
    }
    if(!externalId)continue;
    const response=await fetch(base+'/booking/'+encodeURIComponent(externalId),{signal:AbortSignal.timeout(15000)});
    if(!response.ok)continue;
    const external=await response.json();
    const status=external.booking?.status;
    if(['pendente','confirmado','rejeitado','cancelado','concluido'].includes(status)){
     const {error}=await db.rpc('apply_professional_status',{p_external:externalId,p_status:status,p_reason:external.booking?.status_reason || null});
     if(error)throw error;
    }
   }
   return json({success:true});
  }
  if(body.action!=='create')return json({error:'Ação inválida'},400);
  if(!key)return json({error:'A integração Staff precisa da chave FITPRO_API_KEY configurada no servidor. Nenhum crédito foi debitado.'},503);
  if(!/^[0-9a-f-]{36}$/i.test(body.request_id||'')||!/^[0-9a-f-]{36}$/i.test(body.freelancer_id||'')||typeof body.method!=='string'||body.method.length>100||!body.slot||!Number.isFinite(Date.parse(body.slot))||Date.parse(body.slot)<=Date.now())return json({error:'Confira profissional, método e data futura.'},400);
  const details={freelancer_id:body.freelancer_id,method:body.method,slot:new Date(body.slot).toISOString(),hub:String(body.hub||'').slice(0,200),professional_name:String(body.professional_name||'Profissional').slice(0,200)};
  const {data:request,error:reserveError}=await db.rpc('reserve_professional_credit',{p_id:body.request_id,p_user:identity.user.id,p_aluno:student.id,p_details:details});
  if(reserveError)throw reserveError;
  if(request.status!=='reserved')return json({success:['sent','cancel_requested'].includes(request.status),request_id:request.id,status:request.status,message:'Solicitação já registrada. Consulte o histórico antes de repetir.'});
  const {data:claimed,error:claimError}=await db.from('professional_booking_requests').update({status:'dispatching'}).eq('id',request.id).eq('status','reserved').select('id').maybeSingle();
  if(claimError)throw claimError;
  if(!claimed)return json({request_id:request.id,status:'dispatching',message:'Reserva em processamento.'});
  let response:Response;
  try{
   response=await fetch(base+'/booking',{method:'POST',headers:{'Content-Type':'application/json','x-fitpro-key':key},body:JSON.stringify({...details,client_id:student.id,client_name:student.nome,client_email:student.email,client_phone:student.telefone,external_ref:request.id}),signal:AbortSignal.timeout(20000)});
  }catch{
   await db.rpc('finish_professional_booking',{p_id:request.id,p_external:null,p_error:'Resposta externa não confirmada',p_refund:false});
   return json({request_id:request.id,status:'unknown',message:'A confirmação está pendente. Atualize o histórico; não faça uma nova reserva.'},202);
  }
  if(!response.ok){
   const safeRefund=response.status>=400&&response.status<500;
   const {error}=await db.rpc('finish_professional_booking',{p_id:request.id,p_external:null,p_error:'Staff respondeu '+response.status,p_refund:safeRefund});
   if(error)throw error;
   return json({error:safeRefund?'A Staff recusou a reserva. Seu crédito foi devolvido.':'Confirmação externa pendente. Atualize o histórico antes de repetir.',request_id:request.id,status:safeRefund?'failed':'unknown'},safeRefund?409:202);
  }
  const external=await response.json();
  const externalId=external.booking_id || external.id || external.booking?.id;
  if(!externalId){await db.rpc('finish_professional_booking',{p_id:request.id,p_external:null,p_error:'Identificador externo ausente',p_refund:false});return json({request_id:request.id,status:'unknown',message:'Confirmação externa pendente.'},202);}
  const {error:finishError}=await db.rpc('finish_professional_booking',{p_id:request.id,p_external:externalId,p_error:null,p_refund:false});
  if(finishError){await db.rpc('finish_professional_booking',{p_id:request.id,p_external:null,p_error:'Espelho local pendente',p_refund:false});return json({request_id:request.id,status:'unknown',message:'Reserva enviada; reconciliação local pendente. Atualize o histórico.'},202);}
  return json({success:true,request_id:request.id,status:'sent'});
 }catch(e){console.error('staff-booking:',(e as Error).message);return json({error:(e as Error).message||'Falha ao processar reserva.'},400);}
});

