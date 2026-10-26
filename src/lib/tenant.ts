/** A selected tenant is explicit. Organization type never selects another tenant. */
export function resolveOrganization<T extends { id: string; tipo: string }>(current: T | null, type: string): T | null {
  return current?.tipo === type ? current : null;
}

export function contextKey(userId: string | null | undefined, organizationId: string | null | undefined, role: string | null) {
  return JSON.stringify([userId || null, organizationId || null, role]);
}

/** Prevent late A/B/A responses from becoming current, including after unmount. */
export function createRequestGate() {
  let version = 0;
  return {
    next: () => ++version,
    invalidate: () => { ++version; },
    isCurrent: (request: number) => request === version,
  };
}
