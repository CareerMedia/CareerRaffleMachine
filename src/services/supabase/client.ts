/**
 * Supabase client placeholder for future production integration.
 * The app runs on mock data until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseClientType = any;

export async function createSupabaseClient(): Promise<SupabaseClientType | null> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  // Dynamic import — @supabase/supabase-js is added when connecting production backend.
  const moduleName = '@supabase/supabase-js';
  const { createClient } = await import(/* @vite-ignore */ moduleName);
  return createClient(url, anonKey);
}
