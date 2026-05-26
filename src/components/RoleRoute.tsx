import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { AppRole } from '@/hooks/useCurrentUserRole';

export function RoleRoute({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { loading, isAdmin, activeRole, memberships } = useOperationalContext();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#07070A] text-muted-foreground">Carregando…</div>;
  }

  // Admin sempre tem acesso a qualquer persona (preview)
  if (isAdmin) return <>{children}</>;

  if (activeRole && allow.includes(activeRole)) return <>{children}</>;

  // Usuário sem papel adequado, mas com memberships → manda escolher
  if (memberships.length > 0) return <Navigate to="/select-context" replace />;
  return <Navigate to="/login" replace />;
}
