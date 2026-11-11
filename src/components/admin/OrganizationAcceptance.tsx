import { useEffect, useRef, useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Acceptance = { actor_id: string; id: string; created_at: string; revision: string; environment: string; passed: boolean; evidence: string };

export function OrganizationAcceptance({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<Acceptance[] | null>(null);
  const [actors, setActors] = useState<Record<string,string>>({});
  const [loadError, setLoadError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState('');
  const [environment, setEnvironment] = useState('homologacao');
  const [passed, setPassed] = useState('false');
  const [evidence, setEvidence] = useState('');
  const request = useRef(crypto.randomUUID());
  const locked = useRef(false);

  useEffect(() => {
    let active = true;
    setRows(null); setLoadError(false);
    void (supabase as any).from('organization_acceptance').select('id,actor_id,created_at,revision,environment,passed,evidence')
      .eq('organization_id', orgId).order('created_at', { ascending: false }).limit(10)
      .then(async ({ data, error }: { data: Acceptance[] | null; error: unknown }) => {
        const ids = [...new Set((data ?? []).map(row => row.actor_id))];
        const { data: profiles } = ids.length
          ? await supabase.from('profiles').select('id,nome').in('id', ids) : { data: [] };
        if (active) {
          setRows(data); setLoadError(Boolean(error));
          setActors(Object.fromEntries((profiles ?? []).map(profile => [profile.id, profile.nome])));
        }
      }).catch(() => { if (active) { setRows(null); setLoadError(true); } });
    return () => { active = false; };
  }, [orgId, revision]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true; setSaving(true); setError('');
    try {
      const { error } = await supabase.rpc('record_organization_acceptance', {
        p_request: request.current, p_org: orgId, p_revision: version.trim(),
        p_environment: environment, p_passed: passed === 'true', p_evidence: evidence.trim(),
      });
      if (error) throw error;
      request.current = crypto.randomUUID();
      setEvidence(''); setPassed('false'); setRevision(value => value + 1);
      toast.success('Resultado do ensaio registrado.');
    } catch (failure) { setError((failure as Error).message || 'Não foi possível registrar o ensaio.'); }
    finally { locked.current = false; setSaving(false); }
  };

  return <Card>
    <CardHeader><CardTitle>Homologação com as quatro personas</CardTitle></CardHeader>
    <CardContent className="space-y-5">
      <p className="text-sm text-muted-foreground">Registre o ensaio realizado. Um registro anterior descreve a versão e os pré-requisitos da data do teste.</p>
      <form onSubmit={save}>
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">Versão testada<Input required minLength={3} maxLength={120} value={version} onChange={event => setVersion(event.target.value)} placeholder="Revisão ou identificação da versão" /></label>
          <label className="space-y-1 text-sm">Ambiente<select className="block w-full rounded border bg-background p-2" value={environment} onChange={event => setEnvironment(event.target.value)}><option value="homologacao">Homologação</option><option value="producao">Produção</option></select></label>
          <label className="space-y-1 text-sm sm:col-span-2">Resultado<select className="block w-full rounded border bg-background p-2" value={passed} onChange={event => setPassed(event.target.value)}><option value="false">Com pendências</option><option value="true">Ensaio aprovado</option></select></label>
          <label className="space-y-1 text-sm sm:col-span-2">Evidências e pendências<Textarea required minLength={20} maxLength={4000} value={evidence} onChange={event => setEvidence(event.target.value)} placeholder="Cenários executados, resultados e referências. Use dados de teste." /></label>
          {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <Button type="submit">{saving ? 'Registrando…' : 'Registrar resultado'}</Button>
        </fieldset>
      </form>
      <section className="space-y-2">
        <div className="flex items-center justify-between"><h3 className="font-medium">Últimos ensaios</h3><Button variant="ghost" size="sm" disabled={saving} onClick={() => setRevision(value => value + 1)}>Atualizar</Button></div>
        {loadError ? <p role="alert" className="text-sm">Não foi possível consultar os ensaios.</p>
          : rows === null ? <p role="status">Carregando ensaios…</p>
          : rows.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum ensaio registrado para este condomínio.</p>
          : rows.map(row => <details key={row.id} className="rounded border p-3">
            <summary className="cursor-pointer text-sm"><Badge variant={row.passed ? 'default' : 'outline'}>{row.passed ? 'Aprovado na versão' : 'Com pendências'}</Badge> {row.revision} · {row.environment} · {new Date(row.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</summary>
            <p className="mt-3 text-sm text-muted-foreground">Registrado por {actors[row.actor_id] || 'responsável identificado na auditoria'}</p><p className="mt-2 whitespace-pre-wrap text-sm">{row.evidence}</p>
          </details>)}
      </section>
    </CardContent>
  </Card>;
}
