import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Review = { id: string; aluno_id: string; organization_id: string | null; objetivo: string | null; nivel: string | null; resumo: string | null; status: string; created_at: string };

export default function ReviewQueue() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from('treinos_ia_fila').select('id, aluno_id, organization_id, objetivo, nivel, resumo, status, created_at').eq('status', 'pendente').order('created_at');
    if (error) toast.error(error.message); else setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const decide = async (id: string, status: 'aprovado' | 'rejeitado') => {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from('treinos_ia_fila').update({ status, aprovado_por: auth.user?.id || null, aprovado_em: new Date().toISOString() }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success(status === 'aprovado' ? 'Caso aprovado para prescrição.' : 'Caso rejeitado e devolvido para revisão.');
    load();
  };
  return <div className="p-6 space-y-6"><div><h1 className="text-2xl font-bold">Revisões de segurança</h1><p className="text-sm text-muted-foreground">Avalie casos que não podem receber prescrição automática.</p></div>
    {loading ? <p className="text-muted-foreground">Carregando fila…</p> : !items.length ? <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma revisão pendente.</CardContent></Card> : <div className="grid gap-4">{items.map((item) => <Card key={item.id}><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle className="text-lg">Aluno {item.aluno_id.slice(0, 8)}</CardTitle><p className="text-sm text-muted-foreground">{item.resumo || 'Triagem requer avaliação profissional.'}</p></div><Badge variant="destructive">Pendente</Badge></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2 text-sm"><Badge variant="outline">Objetivo: {item.objetivo || 'não informado'}</Badge>{item.nivel && <Badge variant="outline">Nível: {item.nivel}</Badge>}<Badge variant="outline">Recebido: {new Date(item.created_at).toLocaleDateString('pt-BR')}</Badge></div><div className="flex gap-2"><Button onClick={() => decide(item.id, 'aprovado')}>Aprovar avaliação</Button><Button variant="outline" onClick={() => decide(item.id, 'rejeitado')}>Solicitar revisão</Button></div></CardContent></Card>)}</div>}
  </div>;
}

