'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { JobForm } from '@/components/forms/JobForm'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { Job } from '@/lib/types'

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchJob = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single()
      if (data) setJob(data as Job)
      setLoading(false)
    }
    fetchJob()
  }, [id])

  if (loading) return <PageLoader />

  return (
    <div className="max-w-[760px] mx-auto">
      <Link href="/recruiter/jobs" className="flex items-center gap-2 text-sm font-semibold text-[#6B5A4A] hover:text-[#1A1410] mb-6">
        <ArrowLeft size={16} />
        Retour aux offres
      </Link>
      <h1 className="kz-h2 text-[#1A1410] mb-6">Modifier l&apos;offre</h1>
      <div className="kz-card p-6 bg-white">
        {profile && job && <JobForm job={job} recruiterId={profile.id} />}
      </div>
    </div>
  )
}
