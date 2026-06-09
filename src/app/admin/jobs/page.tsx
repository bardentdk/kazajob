'use client'

import { useEffect, useState } from 'react'
import { Briefcase, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { EmptyState } from '@/components/feedback/EmptyState'
import type { Job } from '@/lib/types'
import { KZ } from '@/lib/constants'
import { timeAgo, formatSalary } from '@/lib/utils'

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/admin/jobs')
      if (res.ok) setJobs((await res.json()) as Job[])
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { fetchJobs() }, [])

  const toggleActive = async (job: Job) => {
    await fetch(`/api/admin/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !job.is_active }),
    })
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, is_active: !j.is_active } : j))
  }

  const deleteJob = async (id: string) => {
    if (!confirm('Supprimer cette offre ?')) return
    await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' })
    setJobs((prev) => prev.filter((j) => j.id !== id))
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-6">
        <h1 className="kz-h2 text-[#1A1410] mb-1">Gestion des offres</h1>
        <p className="text-sm text-[#6B5A4A]">{jobs.length} offre(s) au total</p>
      </div>

      {loading ? <PageLoader /> : jobs.length === 0 ? (
        <EmptyState title="Aucune offre" icon={<Briefcase size={28} />} />
      ) : (
        <div className="kz-card bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                {['Titre', 'Entreprise', 'Lieu', 'Salaire', 'Statut', 'Publie', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[#6B5A4A] uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-[#E8DDC9] last:border-0 hover:bg-[#FBEFE0] transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-[#1A1410] max-w-[200px] truncate">{job.title}</td>
                  <td className="px-4 py-3 text-sm text-[#6B5A4A]">{job.company?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#6B5A4A]">{job.location}</td>
                  <td className="px-4 py-3 text-sm text-[#6B5A4A]">{formatSalary(job.salary_min, job.salary_max)}</td>
                  <td className="px-4 py-3">
                    <Badge color={job.is_active ? 'green' : 'cream'} size="sm">
                      {job.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6B5A4A]">{timeAgo(job.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => toggleActive(job)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#FBEFE0] text-[#6B5A4A] hover:text-[#1A1410]">
                        {job.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => deleteJob(job.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#6B5A4A] hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
