'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Favorite } from '@/lib/types'

export function useFavorites(candidateId?: string) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFavorites = useCallback(async () => {
    if (!candidateId) return
    try {
      const res = await fetch('/api/favorites')
      if (res.ok) setFavorites((await res.json()) as Favorite[])
    } catch { /* garde l'état */ }
    setLoading(false)
  }, [candidateId])

  useEffect(() => { fetchFavorites() }, [fetchFavorites])

  const isFavorite = useCallback((jobId: string) => {
    return favorites.some((f) => f.job_id === jobId)
  }, [favorites])

  const toggle = useCallback(async (jobId: string) => {
    if (!candidateId) return
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    }).catch(() => {})
    await fetchFavorites()
  }, [candidateId, fetchFavorites])

  return { favorites, loading, isFavorite, toggle }
}
