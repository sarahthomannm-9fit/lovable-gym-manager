import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, QrCode, Megaphone, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';

export const MARCOS = [
  { key: 'qr', icon: QrCode, titulo: 'QR instalado', desc: 'Academia, elevador e portaria quando aplicável.' },
  { key: 'comunicado', icon: Megaphone, titulo: 'Comunicado enviado', desc: 'Grupo do condomínio com CTA para anamnese.' },
  { key: 'plantao', icon: FileCheck2, titulo: 'Plantão definido', desc: 'Dia, horário e frequência registrados para prestação de contas.' },
];
export const ROTEIRO = ['Estrutura física e equipamentos', 'Pesquisa de uso e horário de pico', 'Perfil do condomínio e WhatsApp oficial', 'Adesão esperada e unidades interessadas', 'Definição do primeiro plantão', 'Próximos passos: QR, comunicado e contrato'];
export const ONBOARDING_KEYS = [...MARCOS.map((m) => m.key), ...ROTEIRO.map((r) => `roteiro:${r}`)];

/** Conta etapas concluídas a partir de organizations.metadata */
export function onboardingProgress(metadata: any): { done: number; total: number } {
  const c = (metadata?.onboarding_checklist as Record<string, boolean>) || {};
  return { done: ONBOARDING_KEYS.filter((k) => c[k]).length, total: ONBOARDING_KEYS.length };
}

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '');

/** Onboarding / Roteiro de visita. Progresso em metadata.onboarding_checklist e datas em metadata.onboarding_checklist_datas */
export function OnboardingRoteiro({ orgId, onChange }: { orgId: string; onChange?: (metadata: any) => void }) {
  const [meta, setMeta] = useState<any>({});
  const [check, setCheck] = useState<Record<string, boolean>>({});
  const [datas, setDatas] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('organizations').select('metadata').eq('id', orgId).maybeSingle().then(({ data }) => {
      const m = (data?.metadata as any) || {};
      setMeta(m);
      setCheck(m.onboarding_checklist || {});
      setDatas(m.onboarding_checklist_datas || {});
    });
  }, [orgId]);

  const toggle = async (k: string) => {
    const next = { ...check, [k]: !check[k] };
    const nextDatas = { ...datas };
    if (next[k]) nextDatas[k] = new Date().toISOString();
    else delete nextDatas[k];
    setCheck(next);
    setDatas(nextDatas);
    const metadata = { ...meta, onboarding_checklist: next, onboarding_checklist_datas: nextDatas };
    const { error } = await supabase.from('organizations').update({ metadata }).eq('id', orgId);
    if (error) {
      toast.error('Não foi possível salvar o progresso');
      setCheck(check);
      setDatas(datas);
    } else {
      setMeta(metadata);
      onChange?.(metadata);
    }
  };

  const Status = ({ k }: { k: string }) =>
    check[k] ? (
      <Badge className="shrink-0">Concluída{datas[k] ? ` em ${fmt(datas[k])}` : ''}</Badge>
    ) : (
      <Badge variant="outline" className="shrink-0">Pendente</Badge>
    );

  const done = ONBOARDING_KEYS.filter((k) => check[k]).length;
  const total = ONBOARDING_KEYS.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{done} de {total} etapas concluídas</span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
        <Progress value={pct} />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {MARCOS.map((m) => (
          <Card key={m.key} className="bg-card/60 border-border/40">
            <CardContent className="p-4 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={!!check[m.key]} onCheckedChange={() => toggle(m.key)} className="mt-0.5" />
                <m.icon className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{m.titulo}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
              </label>
              <Status k={m.key} />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-card/60 border-border/40">
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-primary" /> Roteiro de visita</h3>
          <div className="space-y-2 text-sm">
            {ROTEIRO.map((item) => {
              const k = `roteiro:${item}`;
              return (
                <div key={item} className="flex items-center justify-between gap-2 rounded-md border border-border/40 p-2">
                  <label className="flex items-start gap-2 cursor-pointer text-muted-foreground">
                    <Checkbox checked={!!check[k]} onCheckedChange={() => toggle(k)} className="mt-0.5" />
                    <span>{item}</span>
                  </label>
                  <Status k={k} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
