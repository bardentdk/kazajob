'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, Users, Briefcase, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useAuth } from '@/features/auth/useAuth'
import { createClient } from '@/lib/supabase/client'
import { APPLICATION_STATUSES, KZ } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import type { Application, Job, Conversation } from '@/lib/types'
import type { BadgeColor } from '@/lib/types'

interface RecruiterStats {
  totalViews: number
  totalApplications: number
  activeJobs: number
  conversionRate: string
}

export default function RecruiterDashboard() {
  const { profile } = useAuth()
  const supabase = createClient()

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
      // Jobs actifs du recruteur
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, company:companies(name)')
        .eq('recruiter_id', profile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)

      // Candidatures sur les offres du recruteur
      const { data: applications } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs!inner(title, recruiter_id, company:companies(name)),
          candidate:profiles(id, full_name, avatar_url)
        `)
        .eq('jobs.recruiter_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Conversations
      const { data: convs } = await supabase
        .from('conversations')
        .select(`
          *,
          candidate:profiles!candidate_id(full_name),
          job:jobs(title)
        `)
        .eq('recruiter_id', profile.id)
        .order('last_message_at', { ascending: false })
        .limit(5)

      const jobsList = (jobs ?? []) as Job[]
      const appsList = (applications ?? []) as Application[]

      setActiveJobs(jobsList)
      setRecentApps(appsList.slice(0, 5))
      setConversations((convs ?? []) as Conversation[])

      // Stats
      const totalViews = jobsList.reduce((sum, j) => sum + (j.views ?? 0), 0)
      const totalApps = appsList.length
      const conversion = totalViews > 0 ? ((totalApps / totalViews) * 100).toFixed(1) + '%' : '0%'

      setStats({
        totalViews,
        totalApplications: totalApps,
        activeJobs: jobsList.length,
        conversionRate: conversion,
      })

      // Compter les statuts du pipeline
      const counts = { pending: 0, viewed: 0, interview: 0, hired: 0 }
      appsList.forEach(a => {
        if (a.status === 'pending') counts.pending++
        else if (a.status === 'viewed') counts.viewed++
        else if (a.status === 'interview') counts.interview++
        else if (a.status === 'hired') counts.hired++
      })
      setPipelineCounts(counts)

      setLoading(false)
    }

    fetchAll()
  }, [profile?.id, supabase])

  const PIPELINE_STAGES = [
    { label: 'Postulations', count: stats.totalApplications, color: KZ.cream2 },
    { label: 'Tri',          count: pipelineCounts.viewed,   color: KZ.yellowSoft },
    { label: 'Entretien',    count: pipelineCounts.interview, color: KZ.blueSoft },
    { label: 'Embauche',     count: pipelineCounts.hired,     color: KZ.greenSoft },
  ]

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Greeting */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="kz-eyebrow mb-1.5" style={{ color: KZ.violet }}>
            Bonjour {profile?.full_name?.split(' ')[0] ?? 'vous'} · {today}
          </p>
          <h1 className="kz-h2 text-[#1A1410]">
            {stats.totalApplications > 0
              ? <><span style={{ color: KZ.violet }}>{stats.totalApplications} candidature{stats.totalApplications > 1 ? 's' : ''}</span> sur vos offres.</>
              : <>Publiez votre <span style={{ color: KZ.violet }}>premiere offre</span>.</>
            }
          </h1>
        </div>
        <Link href="/recruiter/jobs/new">
          <Button kind="primary" size="lg" icon={<Plus size={16} />}>Publier une offre</Button>
        </Link>
      </div>

      {/* KPI — données réelles */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Vues totales"   value={stats.totalViews.toLocaleString('fr-FR')}       color={KZ.violetSoft} icon={<Eye size={16} />} />
        <StatCard label="Candidatures"   value={stats.totalApplications}                         color={KZ.orangeSoft} icon={<Users size={16} />} />
        <StatCard label="Offres actives" value={stats.activeJobs}                                 color={KZ.greenSoft}  icon={<Briefcase size={16} />} />
        <StatCard label="Taux conversion" value={stats.conversionRate}                            color={KZ.yellowSoft} icon={<TrendingUp size={16} />} />
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-5">
        {/* Colonne principale */}
        <div className="flex flex-col gap-5">
          {/* Pipeline */}
          <div className="kz-card p-6 bg-white">
            <h2 className="kz-h3 text-[#1A1410] mb-5">Pipeline de recrutement</h2>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {PIPELINE_STAGES.map((s) => (
                <div key={s.label} className="text-center p-4 rounded-xl border border-[#1A1410]" style={{ background: s.color }}>
                  <div className="text-3xl font-extrabold text-[#1A1410]">{s.count}</div>
                  <div className="text-xs font-semibold text-[#6B5A4A] mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Candidats récents — données réelles */}
            <h3 className="text-sm font-bold text-[#1A1410] mb-3">Candidatures recentes</h3>
            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-[#FBEFE0] animate-pulse" />)}
              </div>
            ) : recentApps.length === 0 ? (
              <EmptyState
                title="Aucune candidature"
                description="Publiez des offres pour commencer a recevoir des candidatures."
                icon={<Users size={22} />}
              />
            ) : (
              <div className="flex flex-col gap-2">
                {recentApps.map((app) => {
                  const statusInfo = APPLICATION_STATUSES[app.status] ?? { label: app.status, color: 'cream' }
                  const candidate = app.candidate as { full_name?: string } | undefined
                  const initials = candidate?.full_name?.split(' ').map((n: string) => n[0]).join('') ?? '?'
                  return (
                    <div key={app.id} className="flex items-center gap-3.5 p-3 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                      <div className="w-9 h-9 rounded-full border border-[#1A1410] flex items-center justify-center text-sm font-bold shrink-0" style={{ background: KZ.orangeSoft }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#1A1410] truncate">{candidate?.full_name ?? 'Candidat'}</div>
                        <div className="text-xs text-[#6B5A4A]">{app.job?.title ?? '—'} · {timeAgo(app.created_at)}</div>
                      </div>
                      <Badge color={statusInfo.color as BadgeColor} size="sm">{statusInfo.label}</Badge>
                      <Link href="/recruiter/applications">
                        <button className="text-[#6B5A4A] hover:text-[#1A1410]"><ArrowRight size={14} /></button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4">
          {/* Offres actives — données réelles */}
          <div className="kz-card p-5 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="kz-h3 text-[#1A1410]">Offres actives</h3>
              <Link href="/recruiter/jobs"><Button kind="soft" size="sm">Gerer</Button></Link>
            </div>
            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-12 rounded-lg bg-[#FBEFE0] animate-pulse" />)}
              </div>
            ) : activeJobs.length === 0 ? (
              <div className="text-xs text-[#6B5A4A] py-3 text-center">
                Aucune offre publiee. <Link href="/recruiter/jobs/new" className="font-bold text-[#FF6B35]">Creer une offre →</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {activeJobs.slice(0, 4).map((job) => (
                  <div key={job.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#1A1410] truncate">{job.title}</div>
                      <div className="text-xs text-[#6B5A4A]">{job.applications_count} cand. · {job.views} vues</div>
                    </div>
                    <Badge color="green" size="sm">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages récents — données réelles */}
          <div className="kz-card p-5 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="kz-h3 text-[#1A1410]">Messages</h3>
              <Link href="/recruiter/messages"><Button kind="soft" size="sm">Voir tout</Button></Link>
            </div>
            {conversations.length === 0 ? (
              <div className="text-xs text-[#6B5A4A] py-3 text-center">Aucun message pour le moment.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {conversations.slice(0, 3).map((conv) => {
                  const candidate = conv.candidate as { full_name?: string } | undefined
                  const initials = candidate?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) ?? '?'
                  return (
                    <div key={conv.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                      <div className="w-8 h-8 rounded-full border border-[#1A1410] flex items-center justify-center text-xs font-bold shrink-0" style={{ background: KZ.paper }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#1A1410] truncate">{candidate?.full_name}</div>
                        <div className="text-xs text-[#6B5A4A] truncate">{conv.job?.title ?? 'Conversation'}</div>
                      </div>
                      <div className="text-[10px] text-[#6B5A4A] shrink-0">{timeAgo(conv.last_message_at)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Conseil IA */}
          <div className="p-4 rounded-xl border border-[#1A1410]" style={{ background: KZ.violetSoft, boxShadow: '3px 3px 0 #1A1410' }}>
            <p className="kz-eyebrow mb-2" style={{ color: KZ.violet }}>Conseil</p>
            <p className="text-sm font-semibold text-[#1A1410]">
              {stats.activeJobs === 0
                ? "Publiez votre premiere offre pour commencer a recevoir des candidatures qualifiees."
                : stats.totalApplications === 0
                ? "Vos offres sont en ligne. Partagez-les sur les reseaux pour attirer plus de candidats."
                : `Vous avez ${pipelineCounts.pending} candidature(s) en attente de traitement.`}
            </p>
            <Link href="/recruiter/applications">
              <Button kind="violet" size="sm" className="mt-3">
                {stats.totalApplications > 0 ? 'Voir les candidatures' : 'Publier une offre'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
