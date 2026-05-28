'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Application } from '@/lib/types'

export function useApplications(candidateId?: string) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchApplications = useCallback(async () => {
    if (!candidateId) return
    setLoading(true)

    const { data } = await supabase
      .from('applications')
      .select(`*, job:jobs(*, company:companies(*))`)
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })

    if (data) setApplications(data as Application[])
    setLoading(false)
  }, [candidateId, supabase])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const apply = useCallback(async (jobId: string, coverLetter?: string) => {
    if (!candidateId) return { error: 'Not authenticated' }

    // Check if already applied
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', candidateId)
      .single()

    if (existing) return { error: 'Vous avez deja postule a cette offre' }

    const { error } = await supabase.from('applications').insert({
      job_id: jobId,
      candidate_id: candidateId,
      cover_letter: coverLetter,
    })

    if (!error) {
      await supabase.rpc('increment_applications_count', { job_id: jobId })
      await fetchApplications()
    }

    return { error: error?.message ?? null }
  }, [candidateId, supabase, fetchApplications])

  const updateStatus = useCallback(async (
    applicationId: string,
    status: Application['status'],
    notes?: string
  ) => {
    const { error } = await supabase
      .from('applications')
      .update({ status, recruiter_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', applicationId)

    if (!error) await fetchApplications()
    return { error }
  }, [supabase, fetchApplications])

  const hasApplied = useCallback((jobId: string) => {
    return applications.some((a) => a.job_id === jobId)
  }, [applications])

  return { applications, loading, apply, updateStatus, hasApplied, refetch: fetchApplications }
}

export function useRecruiterApplications(recruiterId?: string) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!recruiterId) return
    const fetchApplications = async () => {
      const { data } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(*, company:companies(*)),
          candidate:profiles(*)
        `)
        .eq('jobs.recruiter_id', recruiterId)
        .order('created_at', { ascending: false })

      if (data) setApplications(data as Application[])
      setLoading(false)
    }
    fetchApplications()
  }, [recruiterId, supabase])

  return { applications, loading }
}
