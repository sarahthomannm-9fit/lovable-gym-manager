import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { AppRole } from '@/hooks/useCurrentUserRole';

export function RoleRoute({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { loading, isAdmin, activeRole, activeOrg, memberships } = useOperationalContext();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#07070A] text-muted-foreground">Carregando…</div>;
  }

  // Admin sempre pode entrar; mas se entrou via "Trocar" e selecionou uma org de outro papel,
  // respeitamos o activeRole.
  if (isAdmin && !activeOrg) return <>{children}</>;

  if (!activeRole || !allow.includes(activeRole)) {
    return <Navigate to="/select-context" replace />;
  }
  if (!activeOrg && allow.some((r) => r !== 'admin')) {
    // Persona escopada sem org selecionada: força seleção (a menos que tenha 1 só, hook já trata)
    if (memberships.length === 0) return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
