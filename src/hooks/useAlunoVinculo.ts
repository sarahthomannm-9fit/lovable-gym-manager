import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOperationalContext } from '@/hooks/useOperationalContext';

export interface AlunoVinculo {
  id: string;
  nome: string;
  email: string;
  organization_id: string | null;
  user_id: string | null;
}

/**
 * Resolve o cadastro de aluno do usuário logado.
 * Com o RLS atual, o aluno só enxerga a própria linha quando alunos.user_id = auth.uid().
 * Se ainda não houver vínculo, chamamos a edge function que faz o match por e-mail
 * (com service role) e grava o user_id.
 */
export function useAlunoVinculo() {
  const { user } = useAuth();
  const { activeOrg } = useOperationalContext();
  const [aluno, setAluno] = useState<AlunoVinculo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!user) {
      setAluno(null);
      setLoading(false);
      return;
    }
    let mounted = true;
    setAluno(null);
    setLoading(true);
    setError('');

    (async () => {
      let query = supabase
        .from('alunos')
        .select('id, nome, email, organization_id, user_id')
        .eq('user_id', user.id);
      if (activeOrg) query = query.eq('organization_id', activeOrg.id);
      const { data: own, error: lookupError } = await query.maybeSingle();
      if (lookupError) throw lookupError;

      if (own) {
        if (mounted) { setAluno(own as AlunoVinculo); setLoading(false); }
        return;
      }

      const { data, error } = await supabase.functions.invoke('link-aluno-user');
      if (!mounted) return;
      if (error) {
        setError('Não foi possível confirmar seu vínculo. Tente novamente antes de criar outro cadastro.');
        setAluno(null);
      } else {
        const linked = (data as { aluno?: AlunoVinculo })?.aluno;
        setAluno(linked && (!activeOrg || linked.organization_id === activeOrg.id) ? linked : null);
      }
      setLoading(false);
    })().catch(() => { if (mounted) { setLoading(false); setError('Não foi possível consultar seu cadastro. Se você participa de mais de um condomínio, selecione o contexto correto.'); } });

    return () => { mounted = false; };
  }, [user?.id, activeOrg?.id, revision]);

  return { aluno, loading, error, retry: () => setRevision(value => value + 1) };
}
