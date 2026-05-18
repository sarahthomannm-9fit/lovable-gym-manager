import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'manager' | 'user' | 'sindico' | 'professor' | 'corporate';

interface UserRoleState {
  role: AppRole | null;
  loading: boolean;
  userId: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
}

export function useCurrentUserRole(): UserRoleState {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchRole = async (uid: string) => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', uid)
          .maybeSingle();

        if (mounted) {
          if (error) {
            console.error('Error fetching role:', error);
            setRole(null);
          } else {
            setRole(data?.role ?? null);
          }
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setRole(null);
          setLoading(false);
        }
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        const uid = session?.user?.id ?? null;
        setUserId(uid);
        if (uid) {
          fetchRole(uid);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        const uid = session?.user?.id ?? null;
        setUserId(uid);
        if (uid) {
          fetchRole(uid);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    role,
    loading,
    userId,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isUser: role === 'user',
  };
}
