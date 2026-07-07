import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOperationalContext } from '@/hooks/useOperationalContext';

export type OrgPapel = 'sindico' | 'comite' | 'professor' | 'corporate' | 'user' | 'admin' | null;

/**
 * Papel do usuário logado DENTRO da organização ativa.
 * Diferente de useCurrentUserRole (que é role global do sistema).
 */
export function useOrgRole() {
  const { user } = useAuth();
  const { activeOrg, isAdmin } = useOperationalContext();
  const [papel, setPapel] = useState<OrgPapel>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user || !activeOrg) {
        if (mounted) { setPapel(isAdmin ? 'admin' : null); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from('organization_members')
        .select('papel')
        .eq('user_id', user.id)
        .eq('organization_id', activeOrg.id)
        .maybeSingle();
      if (mounted) {
        setPapel((data?.papel as OrgPapel) ?? (isAdmin ? 'admin' : null));
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.id, activeOrg?.id, isAdmin]);

  return {
    papel,
    loading,
    isSindico: papel === 'sindico',
    isComite: papel === 'comite',
    isProfessor: papel === 'professor',
    isCorporate: papel === 'corporate',
    isAdmin: papel === 'admin' || isAdmin,
    canSeeFinancials: papel === 'sindico' || papel === 'admin' || isAdmin,
    canManageComunicados: papel === 'sindico' || papel === 'admin' || isAdmin,
  };
}
