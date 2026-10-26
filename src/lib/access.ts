export function canAccessContext({ isAdmin, hasActiveOrg, activeRole, primaryRole, membershipCount, allow, contextRoles }: {
  isAdmin: boolean; hasActiveOrg: boolean; activeRole: string | null;
  primaryRole: string | null; membershipCount: number; allow: string[]; contextRoles?: string[];
}) {
  if (isAdmin) return true;
  if (hasActiveOrg) return contextRoles ? contextRoles.some(role => allow.includes(role)) : !!activeRole && allow.includes(activeRole);
  return false; // Non-admin access always requires an explicitly selected tenant membership.
}

export function pickPrimaryRole(roles: string[]): string | null {
  return ['admin','manager','sindico','professor','corporate','fisioterapeuta','nutricionista','user'].find(role => roles.includes(role)) ?? null;
}
