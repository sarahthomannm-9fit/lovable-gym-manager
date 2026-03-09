import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Entitlement {
  id: string;
  aluno_id: string;
  sku_id: string;
  status: string;
  data_inicio: string;
  data_fim?: string | null;
  created_at: string;
  updated_at: string;
  sku?: { nome: string; tipo: string; modulos_liberados: string[] | null } | null;
}

export function useEntitlements(alunoId?: string) {
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntitlements = async () => {
    if (!alunoId) { setEntitlements([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('entitlements')
        .select('*, skus(nome, tipo, modulos_liberados)')
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEntitlements((data || []).map((e: any) => ({ ...e, sku: e.skus })));
    } catch (error) {
      console.error('Error fetching entitlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveModules = (): string[] => {
    return entitlements
      .filter(e => e.status === 'ativo')
      .flatMap(e => e.sku?.modulos_liberados || []);
  };

  useEffect(() => { fetchEntitlements(); }, [alunoId]);

  return { entitlements, loading, getActiveModules, refetch: fetchEntitlements };
}
