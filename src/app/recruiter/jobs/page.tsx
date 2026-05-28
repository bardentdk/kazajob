'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye, Users, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { Job } from '@/lib/types'
import { timeAgo, formatSalary } from '@/lib/utils'
import { KZ } from '@/lib/constants'

export default function RecruiterJobsPage() {
  const { profile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchJobs = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('jobs')
      .select('*, company:companies(*)')
      .eq('recruiter_id', profile.id)
      .order('created_at', { ascending: false })

    if (data) setJobs(data as Job[])
    setLoading(false)
  }

  useEffect(() => { if (profile) fetchJobs() }, [profile])

  const toggleActive = async (job: Job) => {
    await supabase.from('jobs').update({ is_active: !job.is_active }).eq('id', job.id)
    fetchJobs()
  }

  const deleteJob = async (id: string) => {
    if (!confirm('Supprimer cette offre ?')) return
    await supabase.from('jobs').delete().eq('id', id)
    fetchJobs()
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="kz-h2 text-[#1A1410] mb-1">Mes offres</h1>
          <p className="text-sm text-[#6B5A4A]">{jobs.length} offre(s)</p>
        </div>
        <Link href="/recruiter/jobs/new">
          <Button kind="primary" size="md" icon={<Plus size={16} />}>Nouvelle offre</Button>
        </Link>
      </div>

      {loading ? <PageLoader /> : jobs.length === 0 ? (
        <EmptyState
          title="Aucune offre publiee"
          description="Creez votre premiere offre d'emploi et trouvez les meilleurs talents de La Reunion."
          icon={<Plus size={28} />}
          action={<Link href="/recruiter/jobs/new"><Button kind="primary">Creer une offre</Button></Link>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div key={job.id} className="kz-card p-5 bg-white flex items-center gap-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-base font-bold text-[#1A1410]">{job.title}</h3>
                  {job.is_boosted && <Badge color="orange" size="sm">Booste</Badge>}
                </div>
                <div className="flex items-center gap-3 text-sm text-[#6B5A4A]">
                  <span>{job.location}</span>
                  <span>·</span>
                  <span>{job.job_type}</span>
                  <span>·</span>
                  <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                  <span>·</span>
                  <span>Publiee {timeAgo(job.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1.5 text-sm text-[#6B5A4A]">
                  <Eye size={14} /> {job.views}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-[#6B5A4A]">
                  <Users size={14} /> {job.applications_count}
                </div>
                <Badge color={job.is_active ? 'green' : 'cream'}>
                  {job.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(job)}
                  className="text-[#6B5A4A] hover:text-[#1A1410]"
                  title={job.is_active ? 'Desactiver' : 'Activer'}
                >
                  {job.is_active ? <ToggleRight size={20} color={KZ.green} /> : <ToggleLeft size={20} />}
                </button>
                <Link href={`/recruiter/jobs/${job.id}/edit`}>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FBEFE0] text-[#6B5A4A] hover:text-[#1A1410]">
                    <Edit size={15} />
                  </button>
                </Link>
                <button
                  onClick={() => deleteJob(job.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#6B5A4A] hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
