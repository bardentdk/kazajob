'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  useSession,
  signIn as nextSignIn,
  signOut as nextSignOut,
} from 'next-auth/react'
import type { Profile } from '@/lib/types'

export function useAuth() {
  const { status } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/me')
      if (res.status === 401) {
        // Session JWT valide mais profil introuvable (compte supprimé / base réinitialisée).
        // Session obsolète → on déconnecte pour éviter une boucle de redirection infinie.
        setProfile(null)
        await nextSignOut({ redirect: false })
      } else if (!res.ok) {
        // Erreur transitoire (5xx) : on n'éjecte pas l'utilisateur.
        setProfile(null)
      } else {
        setProfile((await res.json()) as Profile)
      }
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
      setAuthChecked(true)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      setProfile(null)
      setLoading(false)
      setAuthChecked(true)
      return
    }
    // authenticated
    fetchProfile()
  }, [status, fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await nextSignIn('credentials', { email, password, redirect: false })
    return { error: res?.error ? 'Email ou mot de passe incorrect.' : null }
  }, [])

  // Connexion OAuth (Google / LinkedIn). Le rôle voulu est transmis via cookie
  // pour les inscriptions recruteur, puis lu côté serveur à la création du profil.
  const signInWithProvider = useCallback((
    provider: 'google' | 'linkedin',
    role?: 'candidate' | 'recruiter',
  ) => {
    if (role === 'recruiter') {
      document.cookie = 'kazajob_signup_role=recruiter; path=/; max-age=600; samesite=lax'
    }
    nextSignIn(provider, { callbackUrl: '/auth/post-oauth' })
  }, [])

  const signUp = useCallback(async (
    email: string,
    password: string,
    full_name: string,
    role: 'candidate' | 'recruiter' = 'candidate'
  ) => {
    let res: Response
    try {
      res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName: full_name, role }),
      })
    } catch {
      return { error: 'Failed to fetch — vérifie ta connexion ou réessaie dans quelques secondes.' }
    }

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
      return { error: error ?? 'Erreur inconnue' }
    }

    // Connexion automatique après inscription
    const signInRes = await nextSignIn('credentials', { email, password, redirect: false })
    if (signInRes?.error) return { error: 'Compte créé mais connexion impossible. Connecte-toi.' }

    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await nextSignOut({ redirect: false })
    setProfile(null)
    setAuthChecked(true)
  }, [])

  return { profile, loading, authChecked, signIn, signInWithProvider, signUp, signOut, refetch: fetchProfile }
}
