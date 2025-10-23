import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";

/**
 * Create a Supabase client for use in Client Components
 *
 * IMPORTANT: This uses the anon key (safe for client-side)
 * Never expose the service_role key in the browser
 *
 * @example
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * const supabase = createClient()
 * const { data } = await supabase.from('transactions').select('*')
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Singleton instance for convenience
 * Use this in Client Components that need Supabase
 *
 * @example
 * import { supabase } from '@/lib/supabase/client'
 */
export const supabase = createClient();
