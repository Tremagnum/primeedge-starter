import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return null;
  }

  return createBrowserClient<Database>(supabaseUrl, publishableKey);
}
