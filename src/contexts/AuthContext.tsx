import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const apply = (s: Session | null) => {
      const newId = s?.user?.id ?? null;
      // Avoid re-render storm: only update when user actually changes
      if (newId !== lastUserIdRef.current) {
        lastUserIdRef.current = newId;
        setSession(s);
      } else {
        // still update token silently if same user
        setSession((prev) => (prev?.access_token === s?.access_token ? prev : s));
      }
      setLoading(false);
    };

    // IMPORTANT: only register the auth state listener. Do NOT also call
    // supabase.auth.getSession() here — the two together can deadlock:
    // getSession() acquires an internal lock, and if onAuthStateChange fires
    // (e.g. SIGNED_IN right after a fresh login) while that lock is held,
    // the callback can be left waiting indefinitely, leaving `loading` stuck
    // at `true` forever (the screen never leaves "Carregando...", only a
    // manual refresh recovers because it resets the SDK's internal state).
    //
    // onAuthStateChange already fires once synchronously on subscribe with
    // the current session (event "INITIAL_SESSION"), so it alone is enough
    // to both read the existing session and react to future changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      apply(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
