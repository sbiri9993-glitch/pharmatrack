import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: false,
  signUp: async () => {}, signIn: async () => {}, signOut: async () => {},
  updatePassword: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseReady());

  useEffect(() => {
    if (!isSupabaseReady()) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    if (!isSupabaseReady()) throw new Error('Supabase not configured.');
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw error;
    // Don't wait for the onAuthStateChange listener — set state immediately
    // so the UI (Profile, etc.) reflects the signed-in user right away.
    if (data.session) { setSession(data.session); setUser(data.user); }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseReady()) throw new Error('Supabase not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Same fix as above — set state from the direct response, not the listener.
    if (data.session) { setSession(data.session); setUser(data.user); }
  };

  const signOut = async () => {
    if (!isSupabaseReady()) return;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseReady()) throw new Error('Supabase not configured.');
    if (!user) throw new Error('You must be signed in to change your password.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
