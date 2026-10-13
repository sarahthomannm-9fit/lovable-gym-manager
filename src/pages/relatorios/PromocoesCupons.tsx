import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Percent, Plus, Pause, Play, Ticket } from 'lucide-react';
import { toast } from 'sonner';

type Coupon = { id:string; name:string; code:string; discount_type:'percent'|'fixed'; discount_value:number; starts_on:string; ends_on:string; usage_limit:number|null; usage_count:number; status:string };
const today = () => new Date().toISOString().slice(0,10);

export function PromocoesCupons() {
  const { activeOrg } = useOperationalContext();
  const [rows, setRows] = useState<Coupon[]>([]), [open, setOpen] = useState(false), [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'', code:'', discount_type:'percent', discount_value:'', starts_on:today(), ends_on:'', usage_limit:'' });
  const load = useCallback(async () => {
    if (!activeOrg?.id) return setRows([]);
    const { data, error } = await (supabase as any).from('coupons').select('id,name,code,discount_type,discount_value,starts_on,ends_on,usage_limit,usage_count,status').eq('organization_id',activeOrg.id).order('created_at',{ascending:false});
    if (error) toast.error(error.message); else setRows(data || []);
  }, [activeOrg?.id]);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    if (!activeOrg?.id || !form.name || !form.code || !form.discount_value || !form.ends_on) return toast.error('Preencha nome, código, desconto e validade.');
    setSaving(true); const user = (await supabase.auth.getUser()).data.user;
    const { error } = await (supabase as any).from('coupons').insert({ organization_id:activeOrg.id, name:form.name.trim(), code:form.code.trim().toUpperCase(), discount_type:form.discount_type, discount_value:Number(form.discount_value), starts_on:form.starts_on, ends_on:form.ends_on, usage_limit:form.usage_limit?Number(form.usage_limit):null, status:'active', created_by:user?.id }); setSaving(false);
    if (error) return toast.error(error.message); setOpen(false); setForm({ name:'',code:'',discount_type:'percent',discount_value:'',starts_on:today(),ends_on:'',usage_limit:'' }); await load(); toast.success('Cupom criado e ativado.');
  };
  const toggle = async (c:Coupon) => { const next=c.status==='active'?'paused':'active'; const {error}=await (supabase as any).from('coupons').update({status:next}).eq('id',c.id).eq('organization_id',activeOrg?.id); if(error) toast.error(error.message); else { await load(); toast.success(next==='active'?'Cupom ativado.':'Cupom pausado.'); } };
  const stats=useMemo(()=>({active:rows.filter(r=>r.status==='active').length,uses:rows.reduce((s,r)=>s+r.usage_count,0),limit:rows.reduce((s,r)=>s+(r.usage_limit||0),0)}),[rows]);
  return <div className="space-y-6 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold flex items-center gap-2"><Percent className="text-primary"/>Promoções & cupons</h1><p className="text-muted-foreground">Validade, limite e resgate real na cobrança pendente.</p></div><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button disabled={!activeOrg}><Plus className="w-4 h-4 mr-1"/>Novo cupom</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Criar cupom</DialogTitle></DialogHeader><div className="space-y-3"><Field label="Nome"><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field label="Código"><Input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})}/></Field><div className="grid grid-cols-2 gap-3"><Field label="Tipo"><Select value={form.discount_type} onValueChange={v=>setForm({...form,discount_type:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="percent">Percentual</SelectItem><SelectItem value="fixed">Valor fixo</SelectItem></SelectContent></Select></Field><Field label="Desconto"><Input type="number" min="0.01" value={form.discount_value} onChange={e=>setForm({...form,discount_value:e.target.value})}/></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Início"><Input type="date" value={form.starts_on} onChange={e=>setForm({...form,starts_on:e.target.value})}/></Field><Field label="Fim"><Input type="date" value={form.ends_on} onChange={e=>setForm({...form,ends_on:e.target.value})}/></Field></div><Field label="Limite de uso"><Input type="number" min="1" value={form.usage_limit} onChange={e=>setForm({...form,usage_limit:e.target.value})} placeholder="Sem limite"/></Field><Button className="w-full" disabled={saving} onClick={create}>{saving?'Criando...':'Criar e ativar'}</Button></div></DialogContent></Dialog></div>{!activeOrg&&<p className="text-sm text-muted-foreground">Selecione uma organização.</p>}<div className="grid md:grid-cols-3 gap-4"><Metric title="Ativos" value={stats.active}/><Metric title="Resgates" value={stats.uses}/><Metric title="Limites configurados" value={stats.limit}/></div><Card><CardHeader><CardTitle>Cupons da organização</CardTitle><CardDescription>O desconto é aplicado em transação atômica sobre uma cobrança pendente.</CardDescription></CardHeader><CardContent className="space-y-3">{rows.length===0?<p className="text-sm text-muted-foreground">Nenhum cupom criado.</p>:rows.map(c=><div className="flex flex-wrap gap-3 items-center justify-between rounded border p-3" key={c.id}><div><div className="font-medium">{c.name} <Badge variant="outline" className="ml-1"><Ticket className="w-3 h-3 mr-1"/>{c.code}</Badge></div><p className="text-sm text-muted-foreground">{c.discount_type==='percent'?`${c.discount_value}%`:`R$ ${Number(c.discount_value).toLocaleString('pt-BR')}`} · {c.usage_count}{c.usage_limit?`/${c.usage_limit}`:''} usos · até {new Date(`${c.ends_on}T12:00:00`).toLocaleDateString('pt-BR')}</p></div><Button size="sm" variant="outline" onClick={()=>toggle(c)}>{c.status==='active'?<><Pause className="w-3 h-3 mr-1"/>Pausar</>:<><Play className="w-3 h-3 mr-1"/>Ativar</>}</Button></div>)}</CardContent></Card></div>;
}
function Field({label,children}:{label:string;children:React.ReactNode}) { return <div><Label>{label}</Label>{children}</div>; }
function Metric({title,value}:{title:string;value:string|number}) { return <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{value}</p></CardContent></Card>; }

