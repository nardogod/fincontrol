import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/app/lib/types";

/**
 * Create a Supabase client for use in Client Components
 *
 * IMPORTANT: This uses the anon key (safe for client-side)
 * Never expose the service_role key in the browser
 *
 * @example
 * 'use client'
 * import { createClient } from '@/app/lib/supabase/client'
 *
 * const supabase = createClient()
 * const { data } = await supabase.from('transactions').select('*')
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.warn(
      "Missing Supabase environment variables. Using placeholder values for build."
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Singleton instance for convenience
 * Use this in Client Components that need Supabase
 *
 * @example
 * import { supabase } from '@/app/lib/supabase/client'
 */
export const supabase = createClient();
