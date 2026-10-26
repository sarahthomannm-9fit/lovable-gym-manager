import { resolveOrganization } from '@/lib/tenant';
import { pickPrimaryRole } from '@/lib/access';
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
  error: string | null;
  loading: boolean;
  isAdmin: boolean;
  primaryRole: AppRole | null;
  memberships: Membership[];
  activeOrg: Organization | null;
  activeRole: AppRole | null;
  setActiveOrg: (org: Organization | null, role?: AppRole) => void;
  refresh: (userId?: string) => Promise<void>;
  ensureOrgForPersona: (tipo: Organization['tipo']) => Promise<Organization | null>;
};

const STORAGE_KEY = '9fit:active_org';
const storageKey = (id: string) => `${STORAGE_KEY}:${id}`;

const OperationalContext = createContext<Ctx | null>(null);

export function OperationalContextProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [contextError,setContextError]=useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedRole,setSelectedRole]=useState<AppRole|null>(null);
  const selectedRoleRef=useRef<AppRole|null>(null);
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);

  // refs to read latest state inside stable callbacks without re-creating them
  const activeOrgRef = useRef<Organization | null>(null);
  const membershipsRef = useRef<Membership[]>([]);
  const isAdminRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const loadVersion = useRef(0);

  useEffect(() => { activeOrgRef.current = activeOrg; }, [activeOrg]);
  useEffect(() => { membershipsRef.current = memberships; }, [memberships]);
  useEffect(() => { isAdminRef.current = isAdmin; }, [isAdmin]);

  const load = useCallback(async (userId: string | null = user?.id ?? null) => {
    const request = ++loadVersion.current;
    const isCurrent = () => request === loadVersion.current;
    setLoading(true);setContextError(null);
    try {
      if (!userId) {
        lastUserIdRef.current = null; activeOrgRef.current=null;membershipsRef.current=[];isAdminRef.current=false;
        setIsAdmin(false); setPrimaryRole(null); setMemberships([]); setActiveOrgState(null);setSelectedRole(null);selectedRoleRef.current=null;
        return;
      }
      lastUserIdRef.current = userId;
      membershipsRef.current=[];isAdminRef.current=false;selectedRoleRef.current=null;setSelectedRole(null);
      setIsAdmin(false); setPrimaryRole(null); setMemberships([]); activeOrgRef.current=null; setActiveOrgState(null);

      const { data: roleRow, error: roleError } = await supabase
        .from('user_roles').select('role').eq('user_id', userId);
      if (!isCurrent()) return;
      if (roleError) throw roleError;
      const role = pickPrimaryRole((roleRow || []).map(r=>r.role)) as AppRole | null;
      setPrimaryRole(role);
      setIsAdmin(role === 'admin');

      let list: Membership[] = [];
      try {
        const { data: memRows, error: membershipsError } = await (supabase as any)
          .from('organization_members')
          .select('organization_id, papel, organization:organizations(id, nome, tipo, status)')
          .eq('user_id', userId);
        if (!isCurrent()) return;
        if (membershipsError) throw membershipsError;
        list = (memRows || []).filter((m: any) => m.organization);
      } catch (e) {
        throw e;
      }

      // Administradores precisam enxergar o catálogo completo de organizações,
      // mesmo quando ainda não possuem um vínculo em organization_members.
      // Sem isso, condomínios recém-criados desaparecem do seletor de contexto.
      if (role === 'admin') {
        const { data: allOrganizations, error: organizationsError } = await (supabase as any)
          .from('organizations')
          .select('id, nome, tipo, status')
          .order('nome');
        if (!organizationsError) {
          const byId = new Map(list.map((m) => [m.organization_id, m]));
          (allOrganizations || []).forEach((organization: Organization) => {
            if (!byId.has(organization.id)) {
              list.push({ organization_id: organization.id, papel: 'admin', organization });
            }
          });
        } else {
          console.warn('[OperationalContext] organizations load failed', organizationsError);
        }
      }
      if (!isCurrent()) return;
      membershipsRef.current=list; isAdminRef.current=role==='admin';
      setMemberships(list);

      const savedId = localStorage.getItem(storageKey(userId));
      const saved = list.find((m) => m.organization.id === savedId)?.organization
        ?? (new Set(list.map(m=>m.organization_id)).size === 1 ? list[0]?.organization : null);
      activeOrgRef.current=saved;
      setActiveOrgState(saved);
      const storedRole=localStorage.getItem(storageKey(userId)+':role');
      const allowedRoles=list.filter(m=>m.organization_id===saved?.id).map(m=>m.papel);
      const restoredRole=(role==='admin'&&storedRole?storedRole:allowedRoles.includes(storedRole as AppRole)?storedRole:pickPrimaryRole(allowedRoles)) as AppRole|null;
      setSelectedRole(restoredRole);selectedRoleRef.current=restoredRole;
    } catch (e) {
      if(isCurrent()){setContextError('Não foi possível carregar seus acessos. Tente novamente antes de continuar.');setIsAdmin(false);setPrimaryRole(null);setMemberships([]);setActiveOrgState(null);membershipsRef.current=[];activeOrgRef.current=null;isAdminRef.current=false;}
      console.error('[OperationalContext] load failed', e);
    } finally {
      if(isCurrent())setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    const userId = user?.id ?? null;
    if (userId !== lastUserIdRef.current) {
      load(userId);
    } else if (lastUserIdRef.current === null && userId === null) {
      // anonymous: ensure loading flag goes false
      setLoading(false);
    }
  }, [authLoading, user?.id, load]);

  const setActiveOrg = useCallback((org: Organization | null, role?: AppRole) => {
    if(org && !isAdminRef.current && !membershipsRef.current.some(m=>m.organization_id===org.id))return;
    const roles=membershipsRef.current.filter(m=>m.organization_id===org?.id).map(m=>m.papel);
    if(role&&!isAdminRef.current&&!roles.includes(role))return;
    const nextRole=role || (roles.includes(selectedRoleRef.current as AppRole)?selectedRoleRef.current:pickPrimaryRole(roles)) as AppRole|null;
    selectedRoleRef.current=nextRole;setSelectedRole(nextRole);
    activeOrgRef.current=org;
    setActiveOrgState(org);
    if (org) {
      localStorage.setItem(storageKey(lastUserIdRef.current!), org.id);
      if(nextRole)localStorage.setItem(storageKey(lastUserIdRef.current!)+':role',nextRole);
      void supabase.rpc('record_user_access',{p_event_type:'context_changed',p_organization_id:org.id}).then(({error})=>{if(error)console.warn('Context audit failed');});
    }
    else localStorage.removeItem(storageKey(lastUserIdRef.current!));
  }, []);

  const ensureOrgForPersona = useCallback(async (tipo: Organization['tipo']): Promise<Organization | null> => {
    return resolveOrganization(activeOrgRef.current,tipo);
  }, [setActiveOrg]);

  const activeRole: AppRole|null = activeOrg
    ? selectedRole ?? (pickPrimaryRole(memberships.filter(m=>m.organization_id===activeOrg.id).map(m=>m.papel)) as AppRole|null) ?? (isAdmin?'admin':null)
    : (isAdmin?'admin':primaryRole);

  const identityChanged=lastUserIdRef.current!==(user?.id??null);
  return (
    <OperationalContext.Provider value={{
      error:contextError,loading:loading||identityChanged,isAdmin:!identityChanged&&isAdmin,primaryRole:identityChanged?null:primaryRole,memberships:identityChanged?[]:memberships,activeOrg:identityChanged?null:activeOrg,activeRole:identityChanged?null:activeRole,
      setActiveOrg, refresh: (userId?: string) => load(userId ?? user?.id ?? null), ensureOrgForPersona,
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
