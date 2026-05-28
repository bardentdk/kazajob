'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setProfile(null)
      setLoading(false)
      setAuthChecked(true)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !data) {
      // Profil absent ou 403 → le créer/recréer via upsert
      const { data: upserted } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email ?? '',
          full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '',
          role: (user.user_metadata?.role as Profile['role']) ?? 'candidate',
        }, { onConflict: 'id' })
        .select()
        .single()

      setProfile(upserted ?? null)
    } else {
      setProfile(data as Profile)
    }

    setLoading(false)
    setAuthChecked(true)
  }, [supabase])

  useEffect(() => {
    fetchProfile()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setProfile(null)
        setLoading(false)
        setAuthChecked(true)
        return
      }
      fetchProfile()
    })

    return () => listener.subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [supabase])

  const signUp = useCallback(async (
    email: string,
    password: string,
    full_name: string,
    role: 'candidate' | 'recruiter' = 'candidate'
  ) => {
    // Passer le rôle dans les métadonnées → le trigger l'utilisera
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role },
      },
    })

    if (error || !data.user) return { error }

    // Upsert du profil (idempotent — fonctionne même si le trigger a déjà créé la ligne)
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name,
      role,
    }, { onConflict: 'id' })

    return { error: null }
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setAuthChecked(true)
  }, [supabase])

  return { profile, loading, authChecked, signIn, signUp, signOut, refetch: fetchProfile }
}
