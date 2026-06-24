'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, Users, Briefcase, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { KazaScoreCard } from '@/components/ui/KazaScoreBadge'
import { LaunchBanner } from '@/components/recruiter/LaunchBanner'
import { useAuth } from '@/features/auth/useAuth'
import { APPLICATION_STATUSES, KZ } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import type { Application, Job, Conversation } from '@/lib/types'
import type { BadgeColor } from '@/lib/types'

interface RecruiterStats { totalViews: number; totalApplications: number; activeJobs: number; conversionRate: string }

export default function RecruiterDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<RecruiterStats>({ totalViews: 0, totalApplications: 0, activeJobs: 0, conversionRate: '0%' })
  const [recentApps, setRecentApps] = useState<Application[]>([])
  const [activeJobs, setActiveJobs] = useState<Job[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [pipelineCounts, setPipelineCounts] = useState({ pending: 0, viewed: 0, interview: 0, hired: 0 })
  const [loading, setLoading] = useState(true)
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    if (!profile?.id) return
    const fetchAll = async () => {
      try {
        const [jobsRes, appsRes, convsRes] = await Promise.all([
          fetch('/api/recruiter/jobs'),
          fetch('/api/applications?scope=recruiter'),
          fetch('/api/conversations'),
        ])
        const allJobs = jobsRes.ok ? ((await jobsRes.json()) as Job[]) : []
        const appsList = appsRes.ok ? ((await appsRes.json()) as Application[]) : []
        const convs = convsRes.ok ? ((await convsRes.json()) as Conversation[]) : []

        const jobsList = allJobs.filter(j => j.is_active).slice(0, 5)
        setActiveJobs(jobsList); setRecentApps(appsList.slice(0, 5)); setConversations(convs.slice(0, 5))
        const totalViews = jobsList.reduce((s, j) => s + (j.views ?? 0), 0)
        setStats({ totalViews, totalApplications: appsList.length, activeJobs: jobsList.length, conversionRate: totalViews > 0 ? ((appsList.length / totalViews) * 100).toFixed(1) + '%' : '0%' })
        const counts = { pending: 0, viewed: 0, interview: 0, hired: 0 }
        appsList.forEach(a => { if (a.status in counts) counts[a.status as keyof typeof counts]++ })
        setPipelineCounts(counts)
      } catch { /* noop */ }
      setLoading(false)
    }
    fetchAll()
  }, [profile?.id])

  const PIPELINE = [
    { label: 'Postulations', count: stats.totalApplications, color: KZ.cream2 },
    { label: 'Tri',          count: pipelineCounts.viewed,   color: KZ.yellowSoft },
    { label: 'Entretien',    count: pipelineCounts.interview, color: KZ.blueSoft },
    { label: 'Embauche',     count: pipelineCounts.hired,     color: KZ.greenSoft },
  ]

  return (
    <div className="max-w-[1100px] mx-auto">
      <LaunchBanner />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="kz-eyebrow mb-1.5" style={{ color: KZ.violet }}>Bonjour {profile?.full_name?.split(' ')[0]} · <span className="capitalize">{today}</span></p>
          <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">
            {stats.totalApplications > 0 ? <><span style={{ color: KZ.violet }}>{stats.totalApplications}</span> candidature{stats.totalApplications > 1 ? 's' : ''} recues.</> : <>Publiez votre <span style={{ color: KZ.violet }}>premiere offre</span>.</>}
          </h1>
        </div>
        <Link href="/recruiter/jobs/new" className="shrink-0">
          <Button kind="primary" size="md" icon={<Plus size={15} />}>Nouvelle offre</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Vues" value={stats.totalViews.toLocaleString('fr-FR')} color={KZ.violetSoft} icon={<Eye size={15} />} />
        <StatCard label="Candidatures" value={stats.totalApplications} color={KZ.orangeSoft} icon={<Users size={15} />} />
        <StatCard label="Offres actives" value={stats.activeJobs} color={KZ.greenSoft} icon={<Briefcase size={15} />} />
        <StatCard label="Conversion" value={stats.conversionRate} color={KZ.yellowSoft} icon={<TrendingUp size={15} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Pipeline */}
        <div className="flex flex-col gap-5">
          <div className="kz-card p-5 bg-white">
            <h2 className="text-base font-bold text-[#1A1410] mb-4">Pipeline de recrutement</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
              {PIPELINE.map((s) => (
                <div key={s.label} className="text-center p-3 rounded-xl border border-[#1A1410]" style={{ background: s.color }}>
                  <div className="text-2xl font-extrabold text-[#1A1410]">{s.count}</div>
                  <div className="text-xs font-semibold text-[#6B5A4A] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <h3 className="text-sm font-bold text-[#1A1410] mb-2.5">Candidatures recentes</h3>
            {loading ? (
              <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-[#FBEFE0] animate-pulse" />)}</div>
            ) : recentApps.length === 0 ? (
              <EmptyState title="Aucune candidature" icon={<Users size={20} />} />
            ) : (
              <div className="flex flex-col gap-2">
                {recentApps.map((app) => {
                  const statusInfo = APPLICATION_STATUSES[app.status] ?? { label: app.status, color: 'cream' }
                  const candidate = app.candidate as { full_name?: string } | undefined
                  const initials = candidate?.full_name?.split(' ').map((n: string) => n[0]).join('') ?? '?'
                  return (
                    <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                      <div className="w-8 h-8 rounded-full border border-[#1A1410] flex items-center justify-center text-xs font-bold shrink-0" style={{ background: KZ.orangeSoft }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#1A1410] truncate">{candidate?.full_name ?? 'Candidat'}</div>
                        <div className="text-xs text-[#6B5A4A] truncate">{app.job?.title ?? '—'} · {timeAgo(app.created_at)}</div>
                      </div>
                      <Badge color={statusInfo.color as BadgeColor} size="sm">{statusInfo.label}</Badge>
                      <Link href="/recruiter/applications"><button className="text-[#6B5A4A] hover:text-[#1A1410] shrink-0"><ArrowRight size={13} /></button></Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4">
          <div className="kz-card p-5 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-[#1A1410]">Offres actives</h3>
              <Link href="/recruiter/jobs"><Button kind="soft" size="sm">Gerer</Button></Link>
            </div>
            {loading ? <div className="h-24 rounded-lg bg-[#FBEFE0] animate-pulse" /> :
              activeJobs.length === 0 ? (
                <div className="text-xs text-[#6B5A4A] py-3 text-center">
                  Aucune offre. <Link href="/recruiter/jobs/new" className="font-bold text-[#FF6B35]">Creer →</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeJobs.slice(0, 4).map((job) => (
                    <div key={job.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#1A1410] truncate">{job.title}</div>
                        <div className="text-xs text-[#6B5A4A]">{job.applications_count} cand.</div>
                      </div>
                      <Badge color="green" size="sm">Active</Badge>
                    </div>
                  ))}
                </div>
              )}
          </div>

          <div className="kz-card p-5 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-[#1A1410]">Messages</h3>
              <Link href="/recruiter/messages"><Button kind="soft" size="sm">Tout voir</Button></Link>
            </div>
            {conversations.length === 0 ? (
              <div className="text-xs text-[#6B5A4A] py-3 text-center">Aucun message.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {conversations.slice(0, 3).map((conv) => {
                  const candidate = conv.candidate as { full_name?: string } | undefined
                  const initials = candidate?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) ?? '?'
                  return (
                    <div key={conv.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                      <div className="w-7 h-7 rounded-full border border-[#1A1410] flex items-center justify-center text-xs font-bold shrink-0" style={{ background: KZ.paper }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#1A1410] truncate">{candidate?.full_name}</div>
                        <div className="text-[11px] text-[#6B5A4A]">{timeAgo(conv.last_message_at)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* KazaScore */}
          {profile?.id && <KazaScoreCard recruiterId={profile.id} />}

          <div className="p-4 rounded-xl border border-[#1A1410]" style={{ background: KZ.violetSoft, boxShadow: '3px 3px 0 #1A1410' }}>
            <p className="kz-eyebrow mb-2" style={{ color: KZ.violet }}>Conseil</p>
            <p className="text-sm font-semibold text-[#1A1410]">
              {stats.activeJobs === 0 ? "Publiez votre premiere offre pour commencer a recevoir des candidatures." :
               stats.totalApplications === 0 ? "Vos offres sont en ligne. Partagez-les pour attirer des candidats." :
               `${pipelineCounts.pending} candidature(s) en attente de traitement.`}
            </p>
            <Link href="/recruiter/applications">
              <Button kind="violet" size="sm" className="mt-3">Voir les candidatures</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
