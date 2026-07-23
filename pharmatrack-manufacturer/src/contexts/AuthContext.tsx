import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: false, isAdmin: false,
  signIn: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseReady());
  const [isAdmin, setIsAdmin] = useState(false);

  // Checks the `admins` table to see if the signed-in user is a MINSANTE
  // regulator account rather than a regular manufacturer.
  const checkAdmin = async (uid: string | undefined) => {
    if (!uid || !isSupabaseReady()) { setIsAdmin(false); return; }
    const { data } = await supabase.from('admins').select('id').eq('id', uid).maybeSingle();
    setIsAdmin(!!data);
  };

  useEffect(() => {
    if (!isSupabaseReady()) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      await checkAdmin(session?.user?.id);
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      await checkAdmin(s?.user?.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseReady()) throw new Error('Supabase not configured. Add credentials to .env first.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!isSupabaseReady()) return;
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
