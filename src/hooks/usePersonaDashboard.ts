import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SindicoDashboard = {
  alunos_ativos: number;
  receita_mes: number;
  inadimplentes: number;
  valor_inadimplencia: number;
  aulas_hoje: number;
  ocupacao_media: number | null;
  status: string;
};

export type CoachDashboard = {
  aulas_hoje: any[] | null;
  total_alunos: number;
  checkins_hoje: number;
  proximas_aulas: any[] | null;
};

export type MoradorDashboard = {
  proxima_aula: any | null;
  presencas_mes: number;
  pagamentos_pendentes: number;
  valor_pendente: number;
  treino_hoje: any | null;
  notificacoes_nao_lidas: number;
  status_aluno: any | null;
};

type Persona = 'sindico' | 'coach' | 'morador';

const RPC_BY_PERSONA = {
  sindico: { fn: 'dashboard_sindico', arg: 'p_org_id' },
  coach: { fn: 'dashboard_coach', arg: 'p_prof_id' },
  morador: { fn: 'dashboard_morador', arg: 'p_aluno_id' },
} as const;

/**
 * Indicadores principais das personas sempre pelas RPCs oficiais do banco.
 * Retorna estados padronizados: loading, error, refresh.
 */
export function usePersonaDashboard<T = any>(persona: Persona, id: string | null | undefined) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqRef = useRef(0);

  const load = useCallback(async () => {
    const req = ++reqRef.current;
    if (!id) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { fn, arg } = RPC_BY_PERSONA[persona];
    const { data: res, error: err } = await (supabase as any).rpc(fn, { [arg]: id });
    if (req !== reqRef.current) return;
    if (err) {
      setError(err.message);
      setData(null);
    } else {
      setData((res ?? null) as T);
    }
    setLoading(false);
  }, [persona, id]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}
