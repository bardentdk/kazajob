'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Interview {
  id: string
  application_id: string
  recruiter_id: string
  candidate_id: string
  job_id: string | null
  scheduled_at: string
  duration_min: number
  type: 'video' | 'phone' | 'onsite'
  visio_type: 'jitsi' | 'external' | null
  visio_link: string | null
  location: string | null
  notes: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'done'
  reminder_sent: boolean
  created_at: string
  candidate?: { id: string; full_name: string; email: string; avatar_url?: string }
  recruiter?: { id: string; full_name: string }
  job?: { title: string; company?: { name: string } }
}

export function useInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const res = await globalThis.fetch('/api/interviews')
    const json = await res.json()
    setInterviews(json.interviews ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = useCallback(async (data: {
    applicationId: string
    candidateId: string
    jobId?: string
    scheduledAt: string
    durationMin?: number
    type: 'video' | 'phone' | 'onsite'
    visioType?: 'jitsi' | 'external'
    externalLink?: string
    location?: string
    notes?: string
  }) => {
    const res = await globalThis.fetch('/api/interviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (res.ok) await fetch()
    return json
  }, [fetch])

  const update = useCallback(async (id: string, updates: Partial<Interview>) => {
    const res = await globalThis.fetch('/api/interviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    const json = await res.json()
    if (res.ok) await fetch()
    return json
  }, [fetch])

  // Grouper par date pour l'affichage agenda
  const byDate = interviews.reduce<Record<string, Interview[]>>((acc, iv) => {
    const dateKey = new Date(iv.scheduled_at).toLocaleDateString('fr-FR')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(iv)
    return acc
  }, {})

  const upcoming = interviews.filter(iv =>
    new Date(iv.scheduled_at) >= new Date() && iv.status !== 'cancelled'
  )

  return { interviews, upcoming, byDate, loading, create, update, refetch: fetch }
}
