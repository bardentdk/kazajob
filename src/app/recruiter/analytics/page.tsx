'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, Users, TrendingUp, Briefcase, BarChart2 } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { KazaScoreCard } from '@/components/ui/KazaScoreBadge'
import { useAuth } from '@/features/auth/useAuth'
import { APPLICATION_STATUSES, KZ } from '@/lib/constants'
import type { Application, Job, BadgeColor } from '@/lib/types'

const WEEKS = 8
const WEEK_MS = 7 * 86_400_000

export default function RecruiterAnalyticsPage() {
  const { profile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    const run = async () => {
      try {
        const [jr, ar] = await Promise.all([
          fetch('/api/recruiter/jobs'),
          fetch('/api/applications?scope=recruiter'),
        ])
        setJobs(jr.ok ? ((await jr.json()) as Job[]) : [])
        setApps(ar.ok ? ((await ar.json()) as Application[]) : [])
      } catch { /* noop */ }
      setLoading(false)
    }
    run()
  }, [profile?.id])

  if (loading) return <PageLoader />

  const activeJobs = jobs.filter((j) => j.is_active)
  const totalViews = jobs.reduce((s, j) => s + (j.views ?? 0), 0)
  const totalApps = apps.length
  const conversion = totalViews > 0 ? `${((totalApps / totalViews) * 100).toFixed(1)}%` : '—'

  // Répartition par statut (pipeline complet)
  const statusCounts: Record<string, number> = {}
  apps.forEach((a) => { statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1 })

  // Candidatures reçues sur les 8 dernières semaines
  const now = Date.now()
  const buckets = Array.from({ length: WEEKS }, () => 0)
  apps.forEach((a) => {
    const idx = Math.floor((now - new Date(a.created_at).getTime()) / WEEK_MS)
    if (idx >= 0 && idx < WEEKS) buckets[WEEKS - 1 - idx]++
  })
  const maxWeek = Math.max(1, ...buckets)

  // Top offres par nombre de candidatures
  const topJobs = [...jobs]
    .sort((a, b) => (b.applications_count ?? 0) - (a.applications_count ?? 0))
    .slice(0, 5)

  if (jobs.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto">
        <Header />
        <EmptyState
          title="Pas encore de données"
          description="Publiez votre première offre pour commencer à suivre vos performances de recrutement."
          icon={<BarChart2 size={28} />}
          action={<Link href="/recruiter/jobs/new"><Button kind="primary">Publier une offre</Button></Link>}
        />
      </div>
    )
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      <Header />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Vues totales" value={totalViews.toLocaleString('fr-FR')} color={KZ.violetSoft} icon={<Eye size={15} />} />
        <StatCard label="Candidatures" value={totalApps} color={KZ.orangeSoft} icon={<Users size={15} />} />
        <StatCard label="Taux de conversion" value={conversion} color={KZ.yellowSoft} icon={<TrendingUp size={15} />} />
        <StatCard label="Offres actives" value={activeJobs.length} color={KZ.greenSoft} icon={<Briefcase size={15} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
        {/* Évolution candidatures */}
        <div className="kz-card p-5 bg-white">
          <h2 className="text-base font-bold text-[#1A1410] mb-1">Candidatures reçues</h2>
          <p className="text-xs text-[#6B5A4A] mb-4">8 dernières semaines</p>
          <div className="flex items-end gap-2 h-40">
            {buckets.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="text-[11px] font-bold text-[#1A1410]">{count > 0 ? count : ''}</div>
                <div
                  className="w-full rounded-t-md border border-[#1A1410] transition-all"
                  style={{
                    height: `${Math.max(4, (count / maxWeek) * 120)}px`,
                    background: i === WEEKS - 1 ? KZ.orange : KZ.violetSoft,
                  }}
                  title={`${count} candidature(s)`}
                />
                <div className="text-[10px] text-[#6B5A4A]">S-{WEEKS - 1 - i}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par statut */}
        <div className="kz-card p-5 bg-white">
          <h2 className="text-base font-bold text-[#1A1410] mb-4">Répartition par statut</h2>
          {totalApps === 0 ? (
            <p className="text-xs text-[#6B5A4A] py-3 text-center">Aucune candidature pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {Object.entries(APPLICATION_STATUSES).map(([key, info]) => {
                const count = statusCounts[key] ?? 0
                const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-28 shrink-0">
                      <Badge color={info.color as BadgeColor} size="sm">{info.label}</Badge>
                    </div>
                    <div className="flex-1 h-2.5 rounded-full bg-[#F2E4D0] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: KZ.violet }} />
                    </div>
                    <div className="text-xs font-bold text-[#1A1410] w-8 text-right">{count}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top offres */}
      <div className="kz-card p-5 bg-white mt-5">
        <h2 className="text-base font-bold text-[#1A1410] mb-4">Offres les plus performantes</h2>
        <div className="flex flex-col gap-2">
          {topJobs.map((job) => (
            <div key={job.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#1A1410] truncate">{job.title}</div>
                <div className="text-xs text-[#6B5A4A]">{job.location} · {job.job_type}</div>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-center">
                <div>
                  <div className="text-sm font-extrabold text-[#1A1410]">{job.views ?? 0}</div>
                  <div className="text-[10px] text-[#6B5A4A]">vues</div>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#1A1410]">{job.applications_count ?? 0}</div>
                  <div className="text-[10px] text-[#6B5A4A]">cand.</div>
                </div>
                <Badge color={job.is_active ? 'green' : 'cream'} size="sm">{job.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Réactivité (KazaScore) */}
      {profile?.id && (
        <div className="mt-5 max-w-[420px]">
          <KazaScoreCard recruiterId={profile.id} />
        </div>
      )}
    </div>
  )
}

function Header() {
  return (
    <div className="mb-6">
      <p className="kz-eyebrow mb-1.5" style={{ color: KZ.violet }}>Analytics</p>
      <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">
        Vos performances de recrutement
      </h1>
      <p className="text-sm text-[#6B5A4A] mt-1">Vues, candidatures, conversion et réactivité — en temps réel.</p>
    </div>
  )
}
