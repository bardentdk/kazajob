'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Favorite } from '@/lib/types'

export function useFavorites(candidateId?: string) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchFavorites = useCallback(async () => {
    if (!candidateId) return
    const { data } = await supabase
      .from('favorites')
      .select(`*, job:jobs(*, company:companies(*), skills:job_skills(skill:skills(*)))`)
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })

    if (data) {
      const mapped = data.map((f: Record<string, unknown> & { job?: Record<string, unknown> }) => ({
        ...f,
        job: f.job ? {
          ...f.job,
          skills: ((f.job.skills as Array<{ skill: unknown }>)?.map((s) => s.skill) ?? []),
        } : undefined,
      }))
      setFavorites(mapped as Favorite[])
    }
    setLoading(false)
  }, [candidateId, supabase])

  useEffect(() => { fetchFavorites() }, [fetchFavorites])

  const isFavorite = useCallback((jobId: string) => {
    return favorites.some((f) => f.job_id === jobId)
  }, [favorites])

  const toggle = useCallback(async (jobId: string) => {
    if (!candidateId) return

    if (isFavorite(jobId)) {
      await supabase
        .from('favorites')
        .delete()
        .eq('job_id', jobId)
        .eq('candidate_id', candidateId)
    } else {
      await supabase.from('favorites').insert({ job_id: jobId, candidate_id: candidateId })
    }

    await fetchFavorites()
  }, [candidateId, isFavorite, supabase, fetchFavorites])

  return { favorites, loading, isFavorite, toggle }
}
