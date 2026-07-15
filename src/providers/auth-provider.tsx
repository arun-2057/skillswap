'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { setUnauthenticated, setUser: setStoreUser } = useAuthStore()

  useEffect(() => {
    const getUser = async () => {
      try {
        const timeoutMs = 5000
        const { data: { user }, error } = await Promise.race([
          supabase.auth.getUser(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Auth getUser() timeout')), timeoutMs))
        ])

        if (error || !user) {
          setUser(null)
          setUnauthenticated()
        } else {
          const authUser = {
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
          }
          setUser(authUser)

          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

          setStoreUser({
            id: user.id,
            email: user.email!,
            name: profileData?.name ?? user.user_metadata?.full_name ?? null,
            bio: profileData?.bio ?? null,
            avatar: profileData?.avatar_url ?? null,
            timezone: profileData?.timezone ?? 'UTC',
            skillsOffered: profileData?.skills_offered ?? [],
            skillsWanted: profileData?.skills_wanted ?? [],
            averageRating: profileData?.average_rating ?? 0,
            isOnboarded: profileData?.is_onboarded ?? false,
          })
        }
      } catch (err) {
        console.warn('Auth getUser() failed (likely missing session yet):', err)
        setUser(null)
        setUnauthenticated()
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const authUser = {
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url
        }
        setUser(authUser)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        setStoreUser({
          id: session.user.id,
          email: session.user.email!,
          name: profileData?.name ?? session.user.user_metadata?.full_name ?? null,
          bio: profileData?.bio ?? null,
          avatar: profileData?.avatar_url ?? null,
          timezone: profileData?.timezone ?? 'UTC',
          skillsOffered: profileData?.skills_offered ?? [],
          skillsWanted: profileData?.skills_wanted ?? [],
          averageRating: profileData?.average_rating ?? 0,
          isOnboarded: profileData?.is_onboarded ?? false,
        })
      } else if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setUnauthenticated()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUnauthenticated, setStoreUser])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw error
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const authUser = {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
        }
        setUser(authUser)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        setStoreUser({
          id: user.id,
          email: user.email!,
          name: profileData?.name ?? user.user_metadata?.full_name ?? null,
          bio: profileData?.bio ?? null,
          avatar: profileData?.avatar_url ?? null,
          timezone: profileData?.timezone ?? 'UTC',
          skillsOffered: profileData?.skills_offered ?? [],
          skillsWanted: profileData?.skills_wanted ?? [],
          averageRating: profileData?.average_rating ?? 0,
          isOnboarded: profileData?.is_onboarded ?? false,
        })
      } else {
        setUser(null)
        setUnauthenticated()
      }
    } catch {
      setUser(null)
      setUnauthenticated()
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUnauthenticated()
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}