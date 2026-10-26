import { useEffect, useRef } from 'react';
import { useOperationalContext } from './useOperationalContext';
import { supabase } from '@/integrations/supabase/client';

/** Old, unmounted forms cannot continue a multi-step write after a context switch. */
export function useTenantGuard() {
  const { activeOrg } = useOperationalContext();
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  const requireOrganization = () => {
    if (!live.current || !activeOrg) throw new Error('Selecione novamente o condomínio antes de salvar.');
    return activeOrg.id;
  };
  const requireStudent = async (studentId?: string) => {
    const org = requireOrganization();
    if (!studentId) throw new Error('Selecione um morador deste condomínio.');
    const { data, error } = await supabase.from('alunos').select('id').eq('id',studentId).eq('organization_id',org).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Morador não pertence ao condomínio selecionado.');
    requireOrganization();
    return org;
  };
  return { requireOrganization, requireStudent };
}
