import { createClient } from '@supabase/supabase-js';

// .trim() guards against trailing spaces/newlines that sneak in when
// copy-pasting into .env on Windows — these silently break auth requests.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

const url = supabaseUrl && !supabaseUrl.includes('your_supabase') ? supabaseUrl : 'https://placeholder.supabase.co';
const key = supabaseAnonKey && !supabaseAnonKey.includes('your_supabase') ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(url, key);

export const isSupabaseReady = () =>
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('your_supabase') &&
  !supabaseAnonKey.includes('your_supabase');
