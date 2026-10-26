import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { AppRole } from '@/hooks/useCurrentUserRole';
import { canAccessContext } from '@/lib/access';

export function RoleRoute({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { loading, isAdmin, primaryRole, activeRole, activeOrg, memberships, setActiveOrg, error, refresh } = useOperationalContext();
  const granted=canAccessContext({isAdmin,hasActiveOrg:!!activeOrg,activeRole,primaryRole,membershipCount:memberships.length,allow,contextRoles:activeOrg?memberships.filter(m=>m.organization_id===activeOrg.id).map(m=>m.papel):undefined});
  const persona=allow.length===2&&['user','professor','sindico','corporate'].includes(allow[0])?allow[0]:isAdmin&&allow.length===1&&allow[0]==='admin'?'admin':null;
  useEffect(()=>{
    if(!loading&&granted&&activeOrg&&persona&&activeRole!==persona)setActiveOrg(activeOrg,persona);
  },[loading,granted,activeOrg?.id,persona,activeRole,setActiveOrg]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#07070A] text-muted-foreground">Carregando…</div>;
  }

  if(error)return <div role="alert" className="p-6"><p>{error}</p><button className="underline" onClick={()=>refresh()}>Carregar acessos novamente</button></div>;
  if (granted) return <>{children}</>;

  // Usuário sem papel adequado, mas com memberships → manda escolher
  if (memberships.length > 0) return <Navigate to="/select-context" replace />;
  return <Navigate to="/select-context" replace />;
}
