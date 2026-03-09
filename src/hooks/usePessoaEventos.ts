import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PessoaEvento {
  id: string;
  pessoa_id: string;
  tipo_evento: string;
  descricao: string | null;
  dados: any;
  actor_id: string | null;
  created_at: string;
}

export function usePessoaEventos(pessoaId?: string) {
  const [eventos, setEventos] = useState<PessoaEvento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEventos = async () => {
    if (!pessoaId) { setEventos([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pessoa_eventos')
        .select('*')
        .eq('pessoa_id', pessoaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEventos((data || []) as PessoaEvento[]);
    } catch (error) {
      console.error('Error fetching pessoa eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEvento = async (evento: { pessoa_id: string; tipo_evento: string; descricao?: string; dados?: any }) => {
    const { data, error } = await supabase.from('pessoa_eventos').insert([evento]).select().single();
    if (error) throw error;
    setEventos(prev => [data as PessoaEvento, ...prev]);
    return data;
  };

  useEffect(() => { fetchEventos(); }, [pessoaId]);

  return { eventos, loading, addEvento, refetch: fetchEventos };
}
