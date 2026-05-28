'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { Application } from '@/lib/types'
import { APPLICATION_STATUSES, KZ } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import type { BadgeColor } from '@/lib/types'

export default function RecruiterApplicationsPage() {
  const { profile } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!profile) return
    const fetchApps = async () => {
      let q = supabase
        .from('applications')
        .select(`
          *,
          job:jobs!inner(*, company:companies(*)),
          candidate:profiles(*)
        `)
        .eq('jobs.recruiter_id', profile.id)
        .order('created_at', { ascending: false })

      if (filterStatus) q = q.eq('status', filterStatus)

      const { data } = await q
      if (data) setApplications(data as Application[])
      setLoading(false)
    }
    fetchApps()
  }, [profile, filterStatus, supabase])

  const updateStatus = async (id: string, status: Application['status']) => {
    await supabase.from('applications').update({ status }).eq('id', id)
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
  }

  const STATUS_OPTIONS = [
    { value: '', label: 'Tous les statuts' },
    ...Object.entries(APPLICATION_STATUSES).map(([k, v]) => ({ value: k, label: v.label })),
  ]

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="kz-h2 text-[#1A1410] mb-1">Candidatures recues</h1>
          <p className="text-sm text-[#6B5A4A]">{applications.length} candidature(s)</p>
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-48"
        />
      </div>

      {loading ? <PageLoader /> : applications.length === 0 ? (
        <EmptyState
          title="Aucune candidature"
          description="Publiez des offres pour commencer a recevoir des candidatures."
          icon={<Users size={28} />}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app) => {
            const statusInfo = APPLICATION_STATUSES[app.status] ?? { label: app.status, color: 'cream' }
            const candidate = app.candidate
            const initials = candidate?.full_name?.split(' ').map((n: string) => n[0]).join('') ?? 'CA'

            return (
              <div key={app.id} className="kz-card p-5 bg-white flex items-center gap-5">
                <div className="w-12 h-12 rounded-full border border-[#1A1410] flex items-center justify-center font-bold text-sm shrink-0" style={{ background: KZ.orangeSoft }}>
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-[#1A1410]">{candidate?.full_name}</div>
                  <div className="text-sm text-[#6B5A4A]">
                    {app.job?.title} · {app.job?.company?.name} · {timeAgo(app.created_at)}
                  </div>
                  {app.cover_letter && (
                    <p className="text-xs text-[#6B5A4A] mt-1 line-clamp-1">{app.cover_letter}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge color={statusInfo.color as BadgeColor}>{statusInfo.label}</Badge>
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app.id, e.target.value as Application['status'])}
                    className="text-xs font-semibold h-8 px-2 border border-[#1A1410] rounded-lg bg-white cursor-pointer"
                  >
                    {Object.entries(APPLICATION_STATUSES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  {candidate && (
                    <Link href={`/recruiter/candidates/${candidate.id}`}>
                      <Button kind="soft" size="sm">Profil</Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
