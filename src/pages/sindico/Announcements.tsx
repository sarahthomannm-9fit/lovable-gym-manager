import { useEffect, useState } from 'react';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Announcements() {
  const { activeOrg } = useOperationalContext();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => { if (!activeOrg) return; const { data } = await (supabase as any).from('organization_announcements').select('*').eq('organization_id', activeOrg.id).order('created_at', { ascending: false }); setRows(data || []); };
  useEffect(() => { load(); }, [activeOrg?.id]);
  const create = async () => { if (!activeOrg || !title || !message) return toast.error('Preencha título e mensagem.'); const { error } = await (supabase as any).from('organization_announcements').insert({ organization_id: activeOrg.id, titulo: title, mensagem: message }); if (error) toast.error(error.message); else { toast.success('Rascunho salvo.'); setTitle(''); setMessage(''); load(); } };
  const publish = async (id: string) => { const { error } = await (supabase as any).rpc('publish_organization_announcement', { p_id: id }); if (error) toast.error(error.message); else { toast.success('Publicado.'); load(); } };
  return <div className="min-h-full bg-background p-6 space-y-6"><h1 className="font-display text-3xl font-normal">Comunicados</h1><Card className="rounded-sm shadow-elegant"><CardHeader><CardTitle>Novo comunicado</CardTitle></CardHeader><CardContent className="space-y-3"><Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} /><Textarea placeholder="Mensagem" value={message} onChange={(e) => setMessage(e.target.value)} /><Button onClick={create}>Salvar rascunho</Button></CardContent></Card><Card className="rounded-sm shadow-elegant"><CardHeader><CardTitle>Histórico</CardTitle></CardHeader><CardContent className="space-y-2">{rows.map((row) => <div key={row.id} className="flex items-center justify-between border-b pb-2 text-sm"><span>{row.titulo}<span className="block text-xs text-muted-foreground">{row.status}</span></span>{row.status === 'rascunho' && <Button size="sm" onClick={() => publish(row.id)}>Publicar</Button>}</div>)}</CardContent></Card></div>;
}
