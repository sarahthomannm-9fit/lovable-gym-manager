import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("FITPRO_WEBHOOK_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-stevent-signature",
};

async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!WEBHOOK_SECRET || !signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = Uint8Array.from(signature.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? []);
  return await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(rawBody));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-stevent-signature");

  const valid = await verifySignature(rawBody, signature);
  if (!valid) {
    return new Response(JSON.stringify({ error: "invalid_signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: {
    booking_id: string;
    status: "pendente" | "confirmado" | "rejeitado" | "cancelado" | "concluido";
    reason?: string;
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { booking_id, status, reason } = payload;
  if (!booking_id || !status) {
    return new Response(JSON.stringify({ error: "missing_fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const {error:updateError}=await supabase.rpc('apply_professional_status',{p_external:booking_id,p_status:status,p_reason:reason || null});
  if(updateError)return new Response(JSON.stringify({error:'status_update_failed'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
  const {data:booking}=await supabase.from('staff_bookings').select('id').eq('staff_booking_id',booking_id).single();
  if(!booking)return new Response(JSON.stringify({error:'booking_not_found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
  await supabase.from("system_events").insert({
    entity_type: "staff_booking",
    entity_id: booking.id,
    event_type: `staff_status_${status}`,
    metadata: { staff_booking_id: booking_id, reason: reason ?? null },
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

