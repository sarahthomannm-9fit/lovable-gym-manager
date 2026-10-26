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
  const {activeOrg,isAdmin,memberships,loading}=useOperationalContext();
  const roles=memberships.filter(m=>m.organization_id===activeOrg?.id).map(m=>m.papel as string);
  const isSindico=isAdmin||roles.includes('sindico');
  return {papel:(roles.includes('sindico')?'sindico':roles.includes('professor')?'professor':roles[0]||null) as OrgPapel,isSindico,isComite:false,isProfessor:roles.includes('professor'),isCorporate:roles.includes('corporate'),isUser:roles.includes('user'),isAdmin,canSeeFinancials:isSindico,canManageComunicados:isSindico,loading};
}
