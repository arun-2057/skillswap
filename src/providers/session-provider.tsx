'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from './auth-provider'
import { Toaster } from '@/components/ui/toaster'

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <>
      <AuthProvider>
        {children}
      </AuthProvider>
      <Toaster />
    </>
  )
}
