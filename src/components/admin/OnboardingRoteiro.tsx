import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardList, QrCode, Megaphone, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';

const MARCOS = [
  { key: 'qr', icon: QrCode, titulo: 'QR instalado', desc: 'Academia, elevador e portaria quando aplicável.' },
  { key: 'comunicado', icon: Megaphone, titulo: 'Comunicado enviado', desc: 'Grupo do condomínio com CTA para anamnese.' },
  { key: 'plantao', icon: FileCheck2, titulo: 'Plantão definido', desc: 'Dia, horário e frequência registrados para prestação de contas.' },
];
const ROTEIRO = ['Estrutura física e equipamentos', 'Pesquisa de uso e horário de pico', 'Perfil do condomínio e WhatsApp oficial', 'Adesão esperada e unidades interessadas', 'Definição do primeiro plantão', 'Próximos passos: QR, comunicado e contrato'];

/** Onboarding / Roteiro de visita de uma origem. Progresso salvo em organizations.metadata.onboarding_checklist */
export function OnboardingRoteiro({ orgId }: { orgId: string }) {
  const [meta, setMeta] = useState<any>({});
  const [check, setCheck] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.from('organizations').select('metadata').eq('id', orgId).maybeSingle().then(({ data }) => {
      const m = (data?.metadata as any) || {};
      setMeta(m);
      setCheck(m.onboarding_checklist || {});
    });
  }, [orgId]);

  const toggle = async (k: string) => {
    const next = { ...check, [k]: !check[k] };
    setCheck(next);
    const metadata = { ...meta, onboarding_checklist: next };
    const { error } = await supabase.from('organizations').update({ metadata }).eq('id', orgId);
    if (error) toast.error('Não foi possível salvar o progresso');
    else setMeta(metadata);
  };

  const Item = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <label className="flex items-start gap-2 cursor-pointer">
      <Checkbox checked={!!check[k]} onCheckedChange={() => toggle(k)} className="mt-0.5" />
      {children}
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        {MARCOS.map((m) => (
          <Card key={m.key} className="bg-card/60 border-border/40">
            <CardContent className="p-4">
              <Item k={m.key}>
                <m.icon className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{m.titulo}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
              </Item>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-card/60 border-border/40">
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-primary" /> Roteiro de visita</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
            {ROTEIRO.map((item) => (
              <Item key={item} k={`roteiro:${item}`}><span>{item}</span></Item>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
