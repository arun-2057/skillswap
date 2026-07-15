import { createServerSupabaseClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

async function getCookieStore() {
  const cookieStore = cookies()

  // Next.js dynamic APIs: cookies() may be sync or may require awaiting.
  // createServerSupabaseClient expects sync cookie accessors, so we
  // normalize here into plain sync functions.
  const resolved: any = (cookieStore as any)?.then
    ? await (cookieStore as any)
    : cookieStore

  return {
    getAll: () => {
      const store: any = resolved as any
      if (typeof store?.getAll === 'function') {
        return store.getAll().map((c: any) => ({ name: c.name, value: c.value }))
      }
      return []
    },
    setAll: (cookiesToSet: { name: string; value: string }[]) => {
      const store: any = resolved as any
      if (typeof store?.set === 'function') {
        cookiesToSet.forEach(({ name, value }) => store.set(name, value))
      }
    },
  }
}



export async function requireAuth() {
  const supabase = createServerSupabaseClient(await getCookieStore())


  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError('Authentication required')
  }

  return user
}

export async function getAuthUser() {
  const supabase = createServerSupabaseClient(await getCookieStore())


  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}

// Backwards-compatible helper (used elsewhere in the codebase)
export async function createServerClient() {
  return createServerSupabaseClient(await getCookieStore())
}



