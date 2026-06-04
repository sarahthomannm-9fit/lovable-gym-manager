import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from './useCurrentUserRole';
import { useAuth } from '@/contexts/AuthContext';

export type Organization = {
  id: string;
  nome: string;
  tipo: 'condominio' | 'corporate' | 'professor' | 'studio';
  status: string;
};

export type Membership = {
  organization_id: string;
  papel: AppRole;
  organization: Organization;
};

type Ctx = {
  loading: boolean;
  isAdmin: boolean;
  primaryRole: AppRole | null;
  memberships: Membership[];
  activeOrg: Organization | null;
  activeRole: AppRole | null;
  setActiveOrg: (org: Organization | null) => void;
  refresh: () => Promise<void>;
  ensureOrgForPersona: (tipo: Organization['tipo']) => Promise<Organization | null>;
};

const STORAGE_KEY = '9fit:active_org';

const OperationalContext = createContext<Ctx | null>(null);

export function OperationalContextProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);

  // refs to read latest state inside stable callbacks without re-creating them
  const activeOrgRef = useRef<Organization | null>(null);
  const membershipsRef = useRef<Membership[]>([]);
  const isAdminRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => { activeOrgRef.current = activeOrg; }, [activeOrg]);
  useEffect(() => { membershipsRef.current = memberships; }, [memberships]);
  useEffect(() => { isAdminRef.current = isAdmin; }, [isAdmin]);

  const load = useCallback(async (userId: string | null = user?.id ?? null) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      if (!userId) {
        lastUserIdRef.current = null;
        setIsAdmin(false); setPrimaryRole(null); setMemberships([]); setActiveOrgState(null);
        return;
      }
      lastUserIdRef.current = userId;

      const { data: roleRow } = await supabase
        .from('user_roles').select('role').eq('user_id', userId).maybeSingle();
      const role = (roleRow?.role as AppRole) ?? null;
      setPrimaryRole(role);
      setIsAdmin(role === 'admin');

      let list: Membership[] = [];
      try {
        const { data: memRows } = await (supabase as any)
          .from('organization_members')
          .select('organization_id, papel, organization:organizations(id, nome, tipo, status)')
          .eq('user_id', userId);
        list = (memRows || []).filter((m: any) => m.organization);
      } catch (e) {
        console.warn('[OperationalContext] memberships load failed', e);
      }
      setMemberships(list);

      const savedId = localStorage.getItem(STORAGE_KEY);
      const saved = list.find((m) => m.organization.id === savedId)?.organization
        ?? (list.length === 1 ? list[0].organization : null);
      setActiveOrgState((prev) => (prev?.id === saved?.id ? prev : saved));
    } catch (e) {
      console.error('[OperationalContext] load failed', e);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    const userId = user?.id ?? null;
    if (userId !== lastUserIdRef.current || loading) load(userId);
  }, [authLoading, user?.id, load, loading]);

  const setActiveOrg = useCallback((org: Organization | null) => {
    setActiveOrgState((prev) => (prev?.id === org?.id ? prev : org));
    if (org) localStorage.setItem(STORAGE_KEY, org.id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const ensureOrgForPersona = useCallback(async (tipo: Organization['tipo']): Promise<Organization | null> => {
    const current = activeOrgRef.current;
    if (current && current.tipo === tipo) return current;
    const m = membershipsRef.current.find((x) => x.organization.tipo === tipo);
    if (m) {
      setActiveOrg(m.organization);
      return m.organization;
    }
    if (isAdminRef.current) {
      const { data } = await (supabase as any)
        .from('organizations')
        .select('id, nome, tipo, status')
        .eq('tipo', tipo).limit(1).maybeSingle();
      if (data) {
        setActiveOrg(data);
        return data as Organization;
      }
    }
    return null;
  }, [setActiveOrg]);

  const activeRole = activeOrg
    ? (memberships.find((m) => m.organization.id === activeOrg.id)?.papel ?? (isAdmin ? 'admin' : null))
    : (isAdmin ? 'admin' : primaryRole);

  return (
    <OperationalContext.Provider value={{
      loading, isAdmin, primaryRole, memberships, activeOrg, activeRole,
      setActiveOrg, refresh: () => load(user?.id ?? null), ensureOrgForPersona,
    }}>
      {children}
    </OperationalContext.Provider>
  );
}

export function useOperationalContext() {
  const ctx = useContext(OperationalContext);
  if (!ctx) throw new Error('useOperationalContext must be used inside provider');
  return ctx;
}

export function routeForRole(role: AppRole | null): string {
  switch (role) {
    case 'admin':
    case 'manager': return '/painel';
    case 'sindico': return '/sindico';
    case 'professor': return '/coach';
    case 'corporate': return '/corp';
    case 'user': return '/morador';
    default: return '/select-context';
  }
}
