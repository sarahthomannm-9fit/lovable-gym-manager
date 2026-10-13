import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
export function ServiceRequestsBoard({orgId}:{orgId:string}){const [rows,setRows]=useState<any[]>([]);const load=async()=>{const {data}=await (supabase as any).from("service_requests").select("*,alunos(nome)").eq("organization_id",orgId).order("created_at",{ascending:false});setRows(data||[])};useEffect(()=>{load()},[orgId]);const quote=async(row:any)=>{const value=window.prompt("Valor da proposta");if(!value)return;const {error}=await (supabase as any).rpc("quote_service_request",{p_id:row.id,p_value:Number(value),p_assigned_to:"Sarah",p_preferred_at:null});if(error)toast.error(error.message);else{toast.success("Proposta criada");load()}};return <Card><CardHeader><CardTitle>Solicitações de serviços</CardTitle></CardHeader><CardContent className="space-y-2">{rows.map(row=><div key={row.id} className="flex justify-between rounded border p-3 text-sm"><span>{row.alunos?.nome} · {row.service_type} · {row.status}</span>{row.status==='solicitada'&&<Button size="sm" onClick={()=>quote(row)}>Proposta</Button>}</div>)}</CardContent></Card>}

