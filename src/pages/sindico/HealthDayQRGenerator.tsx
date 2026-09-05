import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { toast } from 'sonner';
import { QrCode, Printer, Plus, Users, CalendarClock } from 'lucide-react';

const ACCENT = '#60A5FA';

type EventoHealthDay = {
  id: string;
  nome: string;
  data_evento: string;
  vagas_totais: number | null;
  ativo: boolean;
  confirmados?: number;
};

/**
 * Gerador de QR do Health Day — aba do painel do Síndico.
 * Cria/lista eventos do tipo Health Day e exibe o QR para impressão ou tela na recepção.
 * QR aponta para /morador/health-day/:eventoId/confirmar
 */
export default function HealthDayQRGenerator() {
  const { activeOrg } = useOperationalContext();
  const [eventos, setEventos] = useState<EventoHealthDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [novo, setNovo] = useState({ nome: 'Health Day', data_evento: '', vagas_totais: '20' });
  const [selecionado, setSelecionado] = useState<EventoHealthDay | null>(null);

  const carregar = async () => {
    if (!activeOrg) { setLoading(false); return; }
    setLoading(true);
    const { data: evs } = await supabase
      .from('eventos_condominio')
      .select('id, nome, data_evento, vagas_totais, ativo')
      .eq('organization_id', activeOrg.id)
      .ilike('nome', '%health day%')
      .order('data_evento', { ascending: false });

    const lista = evs || [];
    const ids = lista.map(e => e.id);
    let contagens: Record<string, number> = {};
    if (ids.length) {
      const { data: inscricoes } = await supabase
        .from('health_day_inscricoes')
        .select('evento_id')
        .in('evento_id', ids)
        .eq('status', 'confirmado');
      contagens = (inscricoes || []).reduce((acc: Record<string, number>, i: any) => {
        acc[i.evento_id] = (acc[i.evento_id] || 0) + 1;
        return acc;
      }, {});
    }

    const comContagem = lista.map(e => ({ ...e, confirmados: contagens[e.id] || 0 }));
    setEventos(comContagem);
    if (!selecionado && comContagem.length) setSelecionado(comContagem[0]);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [activeOrg]);

  const criarEvento = async () => {
    if (!activeOrg) return toast.error('Selecione um condomínio');
    if (!novo.data_evento) return toast.error('Escolha a data do Health Day');
    setCriando(true);
    const { data, error } = await supabase
      .from('eventos_condominio')
      .insert({
        organization_id: activeOrg.id,
        nome: novo.nome || 'Health Day',
        data_evento: novo.data_evento,
        vagas_totais: novo.vagas_totais ? Number(novo.vagas_totais) : null,
        ativo: true,
      })
      .select('id, nome, data_evento, vagas_totais, ativo')
      .single();
    setCriando(false);
    if (error) return toast.error('Falha ao criar evento');
    toast.success('Health Day criado! QR gerado abaixo.');
    setSelecionado({ ...data, confirmados: 0 });
    setNovo({ nome: 'Health Day', data_evento: '', vagas_totais: '20' });
    carregar();
  };

  const linkConfirmacao = (eventoId: string) =>
    `${window.location.origin}/morador/health-day/${eventoId}/confirmar`;

  const qrImgUrl = (eventoId: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(linkConfirmacao(eventoId))}`;

  const imprimir = () => {
    if (!selecionado) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>Health Day — ${selecionado.nome}</title></head>
        <body style="font-family: sans-serif; text-align:center; padding: 40px;">
          <h1>${selecionado.nome}</h1>
          <p>${new Date(selecionado.data_evento).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <img src="${qrImgUrl(selecionado.id)}" style="width:360px;height:360px;margin:24px 0;" />
          <p style="font-size:14px;color:#666;">Aponte a câmera do celular para confirmar presença</p>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground p-6">Carregando…</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/60 border-border/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4" style={{ color: ACCENT }} />
            <h2 className="font-semibold">Criar novo Health Day</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <Input
              value={novo.nome}
              onChange={e => setNovo({ ...novo, nome: e.target.value })}
              placeholder="Nome do evento"
            />
            <Input
              type="date"
              value={novo.data_evento}
              onChange={e => setNovo({ ...novo, data_evento: e.target.value })}
            />
            <Input
              type="number"
              min={1}
              value={novo.vagas_totais}
              onChange={e => setNovo({ ...novo, vagas_totais: e.target.value })}
              placeholder="Vagas totais"
            />
          </div>
          <Button onClick={criarEvento} disabled={criando} className="bg-[#60A5FA] text-black hover:bg-[#60A5FA]/90">
            {criando ? 'Criando…' : 'Criar Health Day'}
          </Button>
        </CardContent>
      </Card>

      {eventos.length === 0 ? (
        <Card className="bg-card/60 border-border/40">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhum Health Day criado ainda para este condomínio.
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {eventos.map(ev => (
              <Card
                key={ev.id}
                onClick={() => setSelecionado(ev)}
                className={`cursor-pointer bg-card/60 border-border/40 transition ${selecionado?.id === ev.id ? 'ring-2' : ''}`}
                style={selecionado?.id === ev.id ? { borderColor: ACCENT } as any : undefined}
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{ev.nome}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" />
                      {new Date(ev.data_evento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    <Users className="w-3 h-3 mr-1" />
                    {ev.confirmados ?? 0}{ev.vagas_totais ? `/${ev.vagas_totais}` : ''}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {selecionado && (
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4" style={{ color: ACCENT }} />
                  <p className="text-sm uppercase tracking-wide text-muted-foreground">QR do Health Day</p>
                </div>
                <img
                  src={qrImgUrl(selecionado.id)}
                  alt={`QR Code — ${selecionado.nome}`}
                  className="mx-auto rounded-lg border border-border/40"
                  width={240}
                  height={240}
                />
                <p className="text-sm font-medium">{selecionado.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {selecionado.confirmados ?? 0} confirmado{(selecionado.confirmados ?? 0) === 1 ? '' : 's'}
                  {selecionado.vagas_totais ? ` de ${selecionado.vagas_totais} vagas` : ''}
                </p>
                <Button onClick={imprimir} variant="outline" className="w-full">
                  <Printer className="w-4 h-4 mr-2" /> Imprimir cartaz
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
