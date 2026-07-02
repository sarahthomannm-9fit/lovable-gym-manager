import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, ArrowRight } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  enviada: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  em_analise: 'bg-amber-500/10 text-amber-500',
  aprovada: 'bg-emerald-500/10 text-emerald-500',
  rejeitada: 'bg-destructive/10 text-destructive',
};

export default function Contratos() {
  const [propostas, setPropostas] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [viewHtml, setViewHtml] = useState<string | null>(null);

  const load = async () => {
    const [{ data: props }, { data: contr }] = await Promise.all([
      (supabase as any).from("proposals").select("*, leads(nome, nome_contato, empresa, tipo, email, telefone)").order("created_at", { ascending: false }),
      supabase.from("propostas_b2b").select("*").order("created_at", { ascending: false }),
    ]);
    setPropostas(props || []); setContratos(contr || []);
  };
  useEffect(() => { load(); }, []);

  const gerarContrato = async (p: any) => {
    const lead = p.leads || {};
    const html = `<!doctype html><html><body style="font-family:sans-serif;padding:32px;">
<h1>Contrato de Assessoria — 9FIT</h1>
<p><b>Empresa:</b> ${lead.empresa || '—'}</p>
<p><b>Contato:</b> ${lead.nome_contato || lead.nome || '—'}</p>
<p><b>Valor mensal:</b> R$ ${Number(p.valor).toLocaleString('pt-BR')}</p>
<p><b>Descrição:</b><br/>${p.descricao || ''}</p>
<p><b>Serviços inclusos:</b><br/>${(p.itens_inclusos || '').replace(/\n/g,'<br/>')}</p>
<p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
</body></html>`;
    const servicos = (p.itens_inclusos || '').split('\n').filter(Boolean).map((t: string) => ({ item: t }));
    const { error } = await supabase.from("propostas_b2b").insert({
      empresa: lead.empresa || 'Sem empresa',
      contato: lead.nome_contato || lead.nome || '',
      email: lead.email || '',
      telefone: lead.telefone || '',
      valor: p.valor,
      servicos,
      status: 'enviado',
      html,
    });
    if (error) return toast.error(error.message);
    await (supabase as any).from("proposals").update({ status: 'aprovada' }).eq('id', p.id);
    toast.success("Contrato gerado e enviado ao cliente!");
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Contratos & Propostas</h1>
        <p className="text-sm text-muted-foreground">Centro comercial da assessoria 9FIT</p>
      </div>

      <Tabs defaultValue="propostas">
        <TabsList>
          <TabsTrigger value="propostas">Propostas ({propostas.length})</TabsTrigger>
          <TabsTrigger value="contratos">Contratos Ativos ({contratos.filter(c => ['enviado','aceito'].includes(c.status)).length})</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="propostas" className="space-y-3 mt-4">
          {propostas.map(p => {
            const lead = p.leads || {};
            const diasVal = p.data_validade ? Math.ceil((new Date(p.data_validade).getTime() - Date.now()) / 86400000) : null;
            return (
              <Card key={p.id}><CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{p.titulo}</span>
                      <Badge className={STATUS_COLOR[p.status] || ''}>{p.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{lead.empresa || lead.nome_contato || 'Sem lead'}</div>
                    <div className="text-2xl font-display font-bold text-primary mt-2">R$ {Number(p.valor).toLocaleString('pt-BR')}</div>
                    {diasVal !== null && (
                      <div className={`text-xs mt-1 ${diasVal < 3 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                        {diasVal < 0 ? 'Expirada' : `Vence em ${diasVal} dias`}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {p.status === 'aprovada' ? (
                      <Button size="sm" variant="premium" onClick={() => gerarContrato(p)}>Gerar contrato <ArrowRight className="w-3 h-3 ml-1"/></Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={async () => { await (supabase as any).from("proposals").update({ status: 'aprovada' }).eq('id', p.id); load(); }}>Marcar aprovada</Button>
                    )}
                  </div>
                </div>
              </CardContent></Card>
            );
          })}
          {propostas.length === 0 && <div className="text-center text-muted-foreground py-10">Nenhuma proposta ainda. Crie no /pipeline.</div>}
        </TabsContent>

        <TabsContent value="contratos" className="space-y-3 mt-4">
          {contratos.filter(c => ['enviado','aceito'].includes(c.status)).map(c => (
            <Card key={c.id}><CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-display font-bold text-lg">{c.empresa}</div>
                  <div className="text-primary font-mono text-lg">R$ {Number(c.valor).toLocaleString('pt-BR')}/mês</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Array.isArray(c.servicos) && c.servicos.slice(0, 5).map((s: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{s.item || String(s)}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={c.status === 'aceito' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}>
                    {c.status === 'aceito' ? 'Assinado ✓' : 'Aguardando assinatura'}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setViewHtml(c.html)}>Ver contrato</Button>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs font-mono uppercase">
                <tr><th className="p-2 text-left">Empresa</th><th className="p-2 text-left">Valor</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Data</th></tr>
              </thead>
              <tbody>
                {contratos.filter(c => ['recusado','expirado'].includes(c.status)).map(c => (
                  <tr key={c.id} className="border-t border-border/50">
                    <td className="p-2">{c.empresa}</td>
                    <td className="p-2">R$ {Number(c.valor).toLocaleString('pt-BR')}</td>
                    <td className="p-2"><Badge variant="outline">{c.status}</Badge></td>
                    <td className="p-2 text-muted-foreground">{new Date(c.updated_at || c.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewHtml} onOpenChange={o => !o && setViewHtml(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Contrato</DialogTitle></DialogHeader>
          <div className="border rounded p-4 bg-white text-black" dangerouslySetInnerHTML={{ __html: viewHtml || '' }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
