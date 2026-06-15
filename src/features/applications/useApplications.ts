'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Application } from '@/lib/types'
import type { PrequalAnswer } from '@/lib/prequal'

export function useApplications(candidateId?: string) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApplications = useCallback(async () => {
    if (!candidateId) return
    setLoading(true)
    try {
      const res = await fetch('/api/applications?scope=candidate')
      if (res.ok) setApplications((await res.json()) as Application[])
    } catch { /* garde l'état */ }
    setLoading(false)
  }, [candidateId])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const apply = useCallback(async (jobId: string, coverLetter?: string, prequalAnswers?: PrequalAnswer[]) => {
    if (!candidateId) return { error: 'Not authenticated' }

    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, coverLetter, prequalAnswers }),
    })
    const body = await res.json().catch(() => ({}))

    if (!res.ok) return { error: body.error ?? 'Erreur inconnue' }

    await fetchApplications()

    // Notifier le recruteur par email (fire & forget)
    if (body.id) {
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'new_application', applicationId: body.id }),
      }).catch(() => {})
    }

    return { error: null }
  }, [candidateId, fetchApplications])

  const updateStatus = useCallback(async (
    applicationId: string,
    status: Application['status'],
    notes?: string
  ) => {
    const res = await fetch(`/api/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    })

    if (res.ok) {
      await fetchApplications()
      // Alerter le candidat par email (fire & forget)
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'application_status', applicationId, status }),
      }).catch(() => {})
      return { error: null }
    }
    const body = await res.json().catch(() => ({}))
    return { error: body.error ?? 'Erreur inconnue' }
  }, [fetchApplications])

  const hasApplied = useCallback((jobId: string) => {
    return applications.some((a) => a.job_id === jobId)
  }, [applications])

  return { applications, loading, apply, updateStatus, hasApplied, refetch: fetchApplications }
}

export function useRecruiterApplications(recruiterId?: string) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!recruiterId) return
    const fetchApplications = async () => {
      try {
        const res = await fetch('/api/applications?scope=recruiter')
        if (res.ok) setApplications((await res.json()) as Application[])
      } catch { /* noop */ }
      setLoading(false)
    }
    fetchApplications()
  }, [recruiterId])

  return { applications, loading }
}
