'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Job, JobFilters } from '@/lib/types'

function toQuery(f: JobFilters): string {
  const sp = new URLSearchParams()
  if (f.q) sp.set('q', f.q)
  if (f.location) sp.set('location', f.location)
  if (f.job_type) sp.set('job_type', f.job_type)
  if (f.sector) sp.set('sector', f.sector)
  if (f.remote !== undefined) sp.set('remote', String(f.remote))
  if (f.salary_min) sp.set('salary_min', String(f.salary_min))
  sp.set('page', String(f.page ?? 1))
  sp.set('limit', String(f.limit ?? 12))
  return sp.toString()
}

export function useJobs(initialFilters?: JobFilters) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [filters, setFilters] = useState<JobFilters>(initialFilters ?? { page: 1, limit: 12 })

  const fetchJobs = useCallback(async (f: JobFilters) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs?${toQuery(f)}`)
      if (res.ok) {
        const { data, count: total } = await res.json()
        setJobs((data ?? []) as Job[])
        setCount(total ?? 0)
      }
    } catch { /* garde l'état précédent */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchJobs(filters)
  }, [filters, fetchJobs])

  const updateFilters = useCallback((partial: Partial<JobFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial, page: 1 }))
  }, [])

  return { jobs, loading, count, filters, updateFilters, refetch: () => fetchJobs(filters) }
}

export function useJob(id: string) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`)
        if (res.ok && !cancelled) setJob((await res.json()) as Job)
      } catch { /* noop */ }
      if (!cancelled) setLoading(false)
    }
    fetchJob()
    return () => { cancelled = true }
  }, [id])

  return { job, loading }
}
