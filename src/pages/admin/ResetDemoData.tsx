import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Navigate } from 'react-router-dom';

const DEMO_TABLES = [
  'pagamentos',
  'checkins',
  'aulas_inscritos',
  'aulas',
  'aulas_experimentais',
  'avaliacoes_fisicas',
  'anamnese_respostas',
  'historico_planos',
  'frequencia_alunos',
  'leads',
  'mensagens_marketing',
  'campanhas_marketing',
  'alunos_planos',
  'alunos',
  'planos',
  'produtos',
  'equipamentos',
  'funcionarios',
  'notificacoes',
] as const;

export default function ResetDemoData() {
  const { role, loading } = useCurrentUserRole();
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Record<string, number | string>>({});

  if (loading) return null;
  if (role !== 'admin') return <Navigate to="/painel" replace />;

  const wipe = async () => {
    if (confirm !== 'LIMPAR') {
      toast.error('Digite LIMPAR para confirmar.');
      return;
    }
    setBusy(true);
    const out: Record<string, number | string> = {};
    for (const t of DEMO_TABLES) {
      const { error, count } = await supabase
        .from(t as any)
        .delete({ count: 'exact' })
        .not('id', 'is', null);
      out[t] = error ? `erro: ${error.message}` : count ?? 0;
    }
    setReport(out);
    setBusy(false);
    toast.success('Dados de demonstração removidos', { description: 'Ambiente pronto para uso comercial.' });
  };

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Limpar dados de demonstração</h1>
        <p className="text-sm text-muted-foreground">Ação restrita ao administrador. Prepara o ambiente para um novo cliente comercial.</p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Ação irreversível</AlertTitle>
        <AlertDescription>
          Esta ação remove TODOS os registros das tabelas operacionais (alunos, pagamentos, aulas, planos, etc.).
          Usuários, papéis e organizações são preservados.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Confirmação</CardTitle>
          <CardDescription>Digite <code className="px-1 bg-muted rounded">LIMPAR</code> abaixo para liberar o botão.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Confirmação</Label>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="LIMPAR" />
          </div>
          <Button variant="destructive" onClick={wipe} disabled={busy || confirm !== 'LIMPAR'} className="w-full">
            {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Limpando...</> : <><Trash2 className="h-4 w-4 mr-2" /> Limpar tudo</>}
          </Button>
        </CardContent>
      </Card>

      {Object.keys(report).length > 0 && (
        <Card>
          <CardHeader><CardTitle>Resultado</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm font-mono space-y-1">
              {Object.entries(report).map(([t, v]) => (
                <li key={t} className="flex justify-between border-b border-border/40 py-1">
                  <span>{t}</span><span className="text-muted-foreground">{String(v)} removidos</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
