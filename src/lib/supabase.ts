import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Browser client for client components.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Factory for a server client with cookie-based session persistence.
// Usage (example):
// const supabase = createServerSupabaseClient({ getAll, setAll })
export function createServerSupabaseClient(cookieStore: {
  getAll: () => { name: string; value: string }[]
  setAll: (cookies: { name: string; value: string }[]) => void
}) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookies) => cookieStore.setAll(cookies),
    },
  })
}

export { createClient }

