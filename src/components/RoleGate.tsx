import React from 'react';
import { useCurrentUserRole, AppRole } from '@/hooks/useCurrentUserRole';

interface RoleGateProps {
  /** Roles allowed to see this content */
  allowed: AppRole[];
  /** Content to render if user has permission */
  children: React.ReactNode;
  /** Optional fallback when user doesn't have permission */
  fallback?: React.ReactNode;
}

export function RoleGate({ allowed, children, fallback = null }: RoleGateProps) {
  const { role, loading } = useCurrentUserRole();

  // While loading, don't render anything (prevents flash)
  if (loading) return null;

  // No authenticated user or no role assigned - show nothing
  if (!role) return <>{fallback}</>;

  // Check if user's role is in the allowed list
  if (allowed.includes(role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
