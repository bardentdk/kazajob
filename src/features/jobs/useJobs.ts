'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Job, JobFilters } from '@/lib/types'

export function useJobs(initialFilters?: JobFilters) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [filters, setFilters] = useState<JobFilters>(initialFilters ?? { page: 1, limit: 12 })
  const supabase = createClient()

  const fetchJobs = useCallback(async (f: JobFilters) => {
    setLoading(true)
    const page = f.page ?? 1
    const limit = f.limit ?? 12
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('jobs')
      .select(`
        *,
        company:companies(*),
        skills:job_skills(skill:skills(*))
      `, { count: 'exact' })
      .eq('is_active', true)
      .range(from, to)
      .order('is_boosted', { ascending: false })
      .order('created_at', { ascending: false })

    if (f.q) query = query.or(`title.ilike.%${f.q}%,description.ilike.%${f.q}%`)
    if (f.location) query = query.eq('location', f.location)
    if (f.job_type) query = query.eq('job_type', f.job_type)
    if (f.sector) query = query.eq('sector', f.sector)
    if (f.remote !== undefined) query = query.eq('remote', f.remote)
    if (f.salary_min) query = query.gte('salary_min', f.salary_min)

    const { data, count: total, error } = await query

    if (!error && data) {
      const mapped = data.map((j: Record<string, unknown>) => ({
        ...j,
        skills: (j.skills as Array<{ skill: unknown }>)?.map((s) => s.skill) ?? [],
      })) as Job[]
      setJobs(mapped)
      setCount(total ?? 0)
    }
    setLoading(false)
  }, [supabase])

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
  const supabase = createClient()

  useEffect(() => {
    const fetchJob = async () => {
      const { data } = await supabase
        .from('jobs')
        .select(`*, company:companies(*), skills:job_skills(skill:skills(*))`)
        .eq('id', id)
        .single()

      if (data) {
        const mapped = {
          ...data,
          skills: data.skills?.map((s: { skill: unknown }) => s.skill) ?? [],
        } as Job
        setJob(mapped)
        // Increment views
        supabase.from('jobs').update({ views: (data.views ?? 0) + 1 }).eq('id', id)
      }
      setLoading(false)
    }
    fetchJob()
  }, [id])

  return { job, loading }
}
