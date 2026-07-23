import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Use dummy values if not configured so the app renders without crashing
const url = supabaseUrl && !supabaseUrl.includes('your_supabase') ? supabaseUrl : 'https://placeholder.supabase.co';
const key = supabaseAnonKey && !supabaseAnonKey.includes('your_supabase') ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(url, key);

export const isSupabaseReady = () =>
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('your_supabase') &&
  !supabaseAnonKey.includes('your_supabase');
