import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from './useCurrentUserRole';

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
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false); setPrimaryRole(null); setMemberships([]); setActiveOrgState(null);
        return;
      }

      const { data: roleRow } = await supabase
        .from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
      const role = (roleRow?.role as AppRole) ?? null;
      setPrimaryRole(role);
      setIsAdmin(role === 'admin');

      let list: Membership[] = [];
      try {
        const { data: memRows } = await (supabase as any)
          .from('organization_members')
          .select('organization_id, papel, organization:organizations(id, nome, tipo, status)')
          .eq('user_id', user.id);
        list = (memRows || []).filter((m: any) => m.organization);
      } catch (e) {
        console.warn('[OperationalContext] memberships load failed', e);
      }
      setMemberships(list);

      const savedId = localStorage.getItem(STORAGE_KEY);
      const saved = list.find((m) => m.organization.id === savedId)?.organization
        ?? (list.length === 1 ? list[0].organization : null);
      setActiveOrgState(saved);
    } catch (e) {
      console.error('[OperationalContext] load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  }, [load]);

  const setActiveOrg = (org: Organization | null) => {
    setActiveOrgState(org);
    if (org) localStorage.setItem(STORAGE_KEY, org.id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const ensureOrgForPersona = async (tipo: Organization['tipo']): Promise<Organization | null> => {
    if (activeOrg && activeOrg.tipo === tipo) return activeOrg;
    // Prefer membership of this tipo
    const m = memberships.find((x) => x.organization.tipo === tipo);
    if (m) { setActiveOrg(m.organization); return m.organization; }
    // Admin fallback: pick first existing org of that tipo
    if (isAdmin) {
      const { data } = await (supabase as any)
        .from('organizations')
        .select('id, nome, tipo, status')
        .eq('tipo', tipo).limit(1).maybeSingle();
      if (data) { setActiveOrg(data); return data as Organization; }
    }
    return null;
  };

  const activeRole = activeOrg
    ? (memberships.find((m) => m.organization.id === activeOrg.id)?.papel ?? (isAdmin ? 'admin' : null))
    : (isAdmin ? 'admin' : primaryRole);

  return (
    <OperationalContext.Provider value={{
      loading, isAdmin, primaryRole, memberships, activeOrg, activeRole,
      setActiveOrg, refresh: load, ensureOrgForPersona,
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
    case 'manager':
    case 'user': return '/painel';
    case 'sindico': return '/sindico';
    case 'professor': return '/coach';
    case 'corporate': return '/corp';
    default: return '/select-context';
  }
}
