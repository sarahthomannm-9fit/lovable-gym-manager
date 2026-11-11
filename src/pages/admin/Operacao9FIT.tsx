import { useAuth } from '@/contexts/AuthContext';
import { OrganizationInfrastructure } from '@/components/admin/OrganizationInfrastructure';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PersonaLayout } from '@/layouts/PersonaLayout';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Building2, Check } from 'lucide-react';

type SetupDraft = { id: string; step: number; name: string; units: string; entry: 'convite' | 'publico'; created: boolean };
function readDraft(key: string): SetupDraft {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (value && /^[0-9a-f-]{36}$/i.test(value.id) && Number.isInteger(value.step) && value.step >= 0 && value.step <= 3
      && typeof value.name === 'string' && typeof value.units === 'string'
      && ['convite','publico'].includes(value.entry) && typeof value.created === 'boolean') return value;
  } catch { /* A malformed draft must not prevent starting. */ }
  return { id: crypto.randomUUID(), step: 0, name: '', units: '', entry: 'convite', created: false };
}

export default function Operacao9FIT() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  if (!user) return null;
  return <CondominiumSetup key={user.id + ':' + (params.get('organization') ?? 'new')}
    draftKey={'nine:admin-setup:' + user.id} organizationId={params.get('organization')} />;
}

function CondominiumSetup({ draftKey, organizationId }: { draftKey: string; organizationId: string | null }) {
  const { isAdmin, refresh, setActiveOrg } = useOperationalContext();
  const navigate = useNavigate();
  const initial = useRef(readDraft(draftKey)).current;
  const [step, setStep] = useState(initial.step);
  const [name, setName] = useState(initial.name);
  const [units, setUnits] = useState(initial.units);
  const [entry, setEntry] = useState<'convite' | 'publico'>(initial.entry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(initial.created);
  const requestId = useRef(organizationId ?? initial.id);
  const locked = useRef(false);
  const [restoring, setRestoring] = useState(true);
  useEffect(() => {
    let live = true;
    const id = requestId.current;
    void supabase.from('organizations').select('id,nome,tipo,metadata,status').eq('id', id).maybeSingle()
      .then(({ data, error: failure }) => {
        if (!live) return;
        if (failure) { setError('Não foi possível verificar a implantação. Recarregue para tentar novamente.'); return; }
        if (data && data.tipo === 'condominio') {
          const metadata = data.metadata as { total_unidades?: number; features?: { public_signup?: boolean } } | null;
          setName(data.nome); setUnits(String(metadata?.total_unidades ?? ''));
          setEntry(metadata?.features?.public_signup ? 'publico' : 'convite');
          setCreated(true);
          setActiveOrg({ id: data.id, nome: data.nome, tipo: 'condominio', status: data.status });
        } else if (organizationId || initial.created) { setError('Condomínio indisponível para retomar.'); return; }
        setRestoring(false);
      }, () => { if (live) setError('Não foi possível verificar a implantação. Tente novamente.'); });
    return () => { live = false; };
  }, [organizationId]);

  useEffect(() => {
    if (restoring || organizationId) return;
    try { localStorage.setItem(draftKey, JSON.stringify({
      id: requestId.current, step, name, units, entry, created,
    })); } catch { /* The server remains authoritative after creation. */ }
  }, [step, name, units, entry, created, restoring, organizationId, draftKey]);


  const valid = () => {
    if (name.trim().length < 2 || name.trim().length > 120) return 'Informe um nome entre 2 e 120 caracteres.';
    if (!Number.isInteger(Number(units)) || Number(units) < 1 || Number(units) > 100000) return 'Informe um total de apartamentos válido.';
    return '';
  };

  const save = async () => {
    if (locked.current) return;
    const validation = valid();
    if (validation) return setError(validation);
    locked.current = true;
    setSaving(true);
    setError('');
    try {
      const payload = {
        id: requestId.current, nome: name.trim(), tipo: 'condominio',
        metadata: { total_unidades: Number(units), features: { public_signup: entry === 'publico' } },
      };
      let { data, error: failure } = await supabase.from('organizations')
        .insert(payload).select('id,nome,tipo,status,metadata').single();
      if (failure) {
        // A retry after a lost response uses the same identifier.
        const existing = await supabase.from('organizations').select('id,nome,tipo,status,metadata')
          .eq('id', requestId.current).maybeSingle();
        if (!existing.data) throw failure;
        data = existing.data;
      }
      if (!data) throw new Error('Não foi possível confirmar o cadastro.');
      if (data.tipo !== 'condominio') throw new Error('O cadastro recuperado não é um condomínio.');
      setName(data.nome);
      // The URL survives remounts even when browser storage is unavailable.
      navigate('/operacao-9fit?organization=' + encodeURIComponent(data.id), { replace: true });
      setActiveOrg({ id: data.id, nome: data.nome, tipo: 'condominio', status: data.status });
      setCreated(true);
      await refresh();
    } catch (failure) {
      setError((failure as Error).message || 'Não foi possível cadastrar. Seus dados continuam nesta tela.');
    } finally {
      locked.current = false;
      setSaving(false);
    }
  };

  const next = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (step === 0 && name.trim().length < 2) return setError('Informe o nome do condomínio.');
    if (step === 1 && (!Number.isInteger(Number(units)) || Number(units) < 1 || Number(units) > 100000)) {
      return setError('Informe quantos apartamentos existem no condomínio.');
    }
    if (step === 3) void save();
    else setStep(value => value + 1);
  };

  return <PersonaLayout title="Cadastrar condomínio" subtitle="Prepare a entrada dos moradores">
    <div className="mx-auto max-w-2xl py-4 sm:py-10">
      {restoring && isAdmin ? <div className="space-y-3 rounded-xl border p-6">
        <p role={error ? 'alert' : 'status'}>{error || 'Verificando implantação salva…'}</p>
        {error && <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button>
          <Button variant="ghost" onClick={() => {
            localStorage.removeItem(draftKey); window.location.assign('/operacao-9fit');
          }}>Iniciar novo cadastro</Button>
        </div>}
      </div> : !isAdmin ? <div className="rounded-xl border bg-card p-6">
        <h2 className="text-xl font-medium">Cadastro com acesso administrativo</h2>
        <p className="mt-2 text-muted-foreground">Acesse com o perfil admin para cadastrar um condomínio.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/select-context')}>Trocar perfil</Button>
      </div> : created ? <div className="rounded-2xl border bg-card p-6 sm:p-10 space-y-5">
        <Check className="h-10 w-10 text-primary" />
        <h2 className="text-2xl font-display">{name.trim()} cadastrado</h2>
        <p className="text-muted-foreground">Vamos cadastrar a infraestrutura. Inclua um item por vez e revise os equipamentos antes de usá-los nos treinos.</p>
        <OrganizationInfrastructure key={requestId.current} orgId={requestId.current} guided />
        <Button onClick={() => navigate('/admin/organizacoes?organization=' + requestId.current + '&tab=vinculos')}>Continuar para equipe e acessos <ArrowRight className="ml-2 h-4 w-4" /></Button>
        <Button variant="ghost" onClick={() => {
          try { localStorage.removeItem(draftKey); } catch { /* Storage can be disabled. */ }
          window.location.assign('/operacao-9fit');
        }}>Iniciar outro condomínio</Button>
      </div> : <form onSubmit={next} className="rounded-2xl border bg-card p-6 sm:p-10 shadow-sm">
        <div className="mb-8 flex items-center justify-between">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">{step + 1} de 4</span>
        </div>
        <div className="mb-8 flex gap-2" aria-label={'Etapa ' + (step + 1) + ' de 4'}>
          {[0,1,2,3].map(index => <div key={index} className={'h-1 flex-1 rounded-full ' + (index <= step ? 'bg-primary' : 'bg-muted')} />)}
        </div>
        {step === 0 && <div key="name" className="space-y-4">
          <label htmlFor="condominium-name" className="block text-2xl font-display">Qual é o nome do condomínio?</label>
          <Input autoFocus id="condominium-name" value={name} onChange={event => setName(event.target.value)} maxLength={120} placeholder="Ex.: Maison Guimet" className="h-12 text-base" />
        </div>}
        {step === 1 && <div key="units" className="space-y-4">
          <label htmlFor="condominium-units" className="block text-2xl font-display">Quantos apartamentos ele tem?</label>
          <Input autoFocus id="condominium-units" type="number" inputMode="numeric" min="1" max="100000" value={units} onChange={event => setUnits(event.target.value)} placeholder="Ex.: 80" className="h-12 text-base" />
        </div>}
        {step === 2 && <fieldset className="space-y-4">
          <legend className="text-2xl font-display">Como os moradores vão entrar?</legend>
          {[
            { value: 'convite', label: 'Por convite', detail: 'A equipe envia o acesso aos moradores.' },
            { value: 'publico', label: 'Pelo QR da academia', detail: 'Moradores podem iniciar o cadastro pelo link público do condomínio.' },
          ].map(option => <label key={option.value} className={'flex cursor-pointer items-start gap-3 rounded-xl border p-4 ' + (entry === option.value ? 'border-primary bg-primary/5' : '')}>
            <input type="radio" name="entry" value={option.value} checked={entry === option.value} onChange={() => setEntry(option.value as 'convite' | 'publico')} className="mt-1" />
            <span><span className="block font-medium">{option.label}</span><span className="text-sm text-muted-foreground">{option.detail}</span></span>
          </label>)}
        </fieldset>}
        {step === 3 && <div className="space-y-4">
          <h2 className="text-2xl font-display">Vamos cadastrar?</h2>
          <dl className="divide-y">
            {[['Condomínio',name.trim()],['Apartamentos',units],['Entrada',entry === 'convite' ? 'Por convite' : 'Pelo QR da academia']].map(([label,value]) => <div key={label} className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium text-right">{value}</dd></div>)}
          </dl>
        </div>}
        {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
        <div className="mt-10 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" disabled={saving} onClick={() => step === 0 ? navigate('/admin/organizacoes') : setStep(value => value - 1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />{step === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          <Button type="submit" disabled={saving}>{saving ? 'Cadastrando…' : step === 3 ? 'Cadastrar condomínio' : 'Continuar'}<ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </form>}
    </div>
  </PersonaLayout>;
}
