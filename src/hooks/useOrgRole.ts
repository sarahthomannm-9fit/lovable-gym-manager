import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';

export type OrgPapel = 'sindico' | 'comite' | 'professor' | 'coach' | 'corporate' | 'corporativo' | 'user' | 'morador' | null;

export interface OrgRoleState {
  papel: OrgPapel;
  isSindico: boolean;
  isComite: boolean;
  isProfessor: boolean;
  isCorporate: boolean;
  isUser: boolean;
  isAdmin: boolean;
  canSeeFinancials: boolean;
  canManageComunicados: boolean;
  loading: boolean;
}

/**
 * Hook que busca o papel do usuário logado na organização atual.
 * Retorna booleanos para facilitar gating de features por role.
 * 
 * Papéis esperados em organization_members.papel:
 * - 'sindico' | 'comite' | 'professor' | 'coach' | 'corporate' | 'corporativo' | 'user' | 'morador'
 */
export function useOrgRole(): OrgRoleState {
  const { user } = useAuth();
  const { activeOrg, isAdmin } = useOperationalContext();
  const [state, setState] = useState<OrgRoleState>({
    papel: null,
    isSindico: false,
    isComite: false,
    isProfessor: false,
    isCorporate: false,
    isUser: false,
    isAdmin: false,
    canSeeFinancials: false,
    canManageComunicados: false,
    loading: true,
  });

  useEffect(() => {
    if (!user || !activeOrg) {
      setState(s => ({ 
        ...s, 
        loading: false,
        isAdmin: isAdmin,
        canSeeFinancials: isAdmin,
        canManageComunicados: isAdmin,
      }));
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const { data: row } = await supabase
          .from('organization_members')
          .select('papel')
          .eq('user_id', user.id)
          .eq('organization_id', activeOrg.id)
          .maybeSingle();

        if (!mounted) return;

        const papel = (row?.papel as OrgPapel) || null;
        
        // Normalizar papéis (coach = professor, corporativo = corporate)
        const normalizePapel = (p: OrgPapel): OrgPapel => {
          if (p === 'coach') return 'professor';
          if (p === 'corporativo') return 'corporate';
          return p;
        };
        const normalizado = normalizePapel(papel);

        // Determinar booleanos
        const isSind = normalizado === 'sindico' || isAdmin;
        const isComit = normalizado === 'comite';
        const isProf = normalizado === 'professor';
        const isCorp = normalizado === 'corporate';
        const isU = normalizado === 'user' || normalizado === 'morador';

        // Financiais: apenas síndico (não comitê)
        const canSeeFin = isSind && !isComit;
        
        // Comunicados: síndico pode gerenciar, comitê apenas lê
        const canManageCom = isSind && !isComit;

        setState({
          papel: normalizado,
          isSindico: isSind,
          isComite: isComit,
          isProfessor: isProf,
          isCorporate: isCorp,
          isUser: isU,
          isAdmin: isAdmin,
          canSeeFinancials: canSeeFin,
          canManageComunicados: canManageCom,
          loading: false,
        });
      } catch (e) {
        console.error('[useOrgRole] Erro ao buscar papel:', e);
        if (mounted) {
          setState(s => ({ 
            ...s, 
            loading: false,
            isAdmin: isAdmin,
            canSeeFinancials: isAdmin,
            canManageComunicados: isAdmin,
          }));
        }
      }
    })();

    return () => { mounted = false; };
  }, [user?.id, activeOrg?.id, isAdmin]);

  return state;
}
