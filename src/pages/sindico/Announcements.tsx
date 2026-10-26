import { PersonaLayout } from '@/layouts/PersonaLayout';
import { useEffect, useState } from 'react';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Announcements() {
  const { activeOrg } = useOperationalContext();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState('');
  const [reads,setReads]=useState<Record<string,number>>({});
  const [editingId,setEditingId] = useState<string|null>(null);
  const [busy,setBusy] = useState(false);
  const load = async () => { if (!activeOrg) return; const { data: eventRows, error: eventsError } = await (supabase as any).from('eventos_condominio').select('id,nome').eq('organization_id', activeOrg.id).order('data_evento'); if (eventsError) toast.error(eventsError.message); setEvents(eventRows || []); const { data, error } = await (supabase as any).from('organization_announcements').select('*').eq('organization_id', activeOrg.id).order('created_at', { ascending: false }); if (error) return toast.error(error.message); setRows(data || []); const {data:receipts,error:receiptError}=await (supabase as any).from('organization_announcement_reads').select('announcement_id').eq('organization_id',activeOrg.id);if(receiptError)toast.error('Não foi possível carregar confirmações de leitura.');const next:Record<string,number>={};for(const receipt of receipts||[])next[receipt.announcement_id]=(next[receipt.announcement_id]||0)+1;setReads(next); };
  useEffect(() => { load(); }, [activeOrg?.id]);
  const create = async () => {
    if(!activeOrg||busy)return;
    if(title.trim().length<3||message.trim().length<3)return toast.error('Preencha título e mensagem com pelo menos 3 caracteres.');
    setBusy(true);
    try{
      const {error}=await (supabase as any).rpc('save_announcement',{p_id:editingId,p_org:activeOrg.id,p_title:title.trim(),p_message:message.trim(),p_event:eventId||null});
      if(error)throw error;
      toast.success('Rascunho salvo.');setTitle('');setMessage('');setEventId('');setEditingId(null);await load();
    }catch(e){toast.error((e as Error).message||'Falha ao salvar.');}finally{setBusy(false);}
  };

  const publish = async (id: string) => { if(busy)return;setBusy(true);const { error } = await (supabase as any).rpc('publish_organization_announcement', { p_id: id }); setBusy(false); if (error) toast.error(error.message); else { toast.success('Comunicado disponível no app para os destinatários.'); load(); } };
  const archive = async (id: string) => { if(busy)return;setBusy(true);const { error } = await (supabase as any).rpc('archive_organization_announcement', { p_id: id }); setBusy(false); if (error) toast.error(error.message); else { toast.success('Comunicado arquivado.'); load(); } };
  return <PersonaLayout title="Comunicados"><div className="min-h-full bg-background p-6 space-y-6"><h1 className="font-display text-3xl font-normal">Comunicados</h1><Card className="rounded-sm shadow-elegant"><CardHeader><CardTitle>{editingId?'Editar rascunho':'Novo comunicado'}</CardTitle></CardHeader><CardContent className="space-y-3"><Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} /><Textarea placeholder="Mensagem" value={message} onChange={(e) => setMessage(e.target.value)} /><Select value={eventId || "none"} onValueChange={(v) => setEventId(v === "none" ? "" : v)}><SelectTrigger><SelectValue placeholder="Vincular a um Health Day (opcional)" /></SelectTrigger><SelectContent><SelectItem value="none">Comunicado geral</SelectItem>{events.map((event) => <SelectItem key={event.id} value={event.id}>{event.nome}</SelectItem>)}</SelectContent></Select><Button disabled={busy} onClick={create}>{busy?'Salvando…':'Salvar rascunho'}</Button>{editingId&&<Button variant="outline" onClick={()=>{setEditingId(null);setTitle('');setMessage('');setEventId('');}}>Cancelar edição</Button>}</CardContent></Card><Card className="rounded-sm shadow-elegant"><CardHeader><CardTitle>Histórico</CardTitle></CardHeader><CardContent className="space-y-2">{rows.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 border-b pb-2 text-sm"><span>{row.titulo}<span className="block text-xs text-muted-foreground">{row.publico === 'evento' ? 'Destinatários inscritos no evento · ' : 'Todo o condomínio · '}{row.status} · {reads[row.id]||0} leitura(s)</span></span><div className="flex gap-2">{row.status === 'rascunho' && <Button size="sm" variant="outline" onClick={()=>{setEditingId(row.id);setTitle(row.titulo);setMessage(row.mensagem);setEventId(row.event_id||'');window.scrollTo({top:0,behavior:'smooth'});}}>Editar</Button>}{row.status === 'rascunho' && <Button size="sm" disabled={busy} onClick={() => publish(row.id)}>Publicar</Button>}{row.status !== 'arquivado' && <Button size="sm" variant="ghost" disabled={busy} onClick={() => archive(row.id)}>Arquivar</Button>}</div></div>)}{!rows.length && <p className="text-sm text-muted-foreground">Nenhum comunicado criado.</p>}</CardContent></Card></div></PersonaLayout>;
}
