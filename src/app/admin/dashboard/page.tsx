'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Briefcase, Building2, TrendingUp, Star, Bell, BookOpen, BarChart2, Sparkles, Zap } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { KZ } from '@/lib/constants'

interface AdminStats {
  users: number
  jobs: number
  companies: number
  applications: number
  candidates: number
  recruiters: number
  admins: number
  events: number
  skills: number
  referrals: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    users: 0, jobs: 0, companies: 0, applications: 0,
    candidates: 0, recruiters: 0, admins: 0,
    events: 0, skills: 0, referrals: 0,
  })
  const [recentJobs, setRecentJobs] = useState<Array<{ id: string; title: string; created_at: string; is_active: boolean }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          const d = await res.json()
          setStats({
            users: d.users ?? 0, jobs: d.jobs ?? 0, companies: d.companies ?? 0,
            applications: d.applications ?? 0, candidates: d.candidates ?? 0,
            recruiters: d.recruiters ?? 0, admins: d.admins ?? 0,
            events: d.events ?? 0, skills: d.skills ?? 0, referrals: d.referrals ?? 0,
          })
          setRecentJobs((d.recentJobs ?? []) as typeof recentJobs)
        }
      } catch { /* noop */ }
      setLoading(false)
    }
    fetchStats()
  }, [])

  // Distribution réelle des rôles
  const total = stats.users || 1
  const roleDistrib = [
    { label: 'Candidats',   count: stats.candidates, pct: Math.round((stats.candidates / total) * 100), color: KZ.orange },
    { label: 'Recruteurs',  count: stats.recruiters,  pct: Math.round((stats.recruiters / total) * 100),  color: KZ.violet },
    { label: 'Admins',      count: stats.admins,      pct: Math.round((stats.admins / total) * 100),      color: KZ.green },
  ]

  if (loading) return <PageLoader />

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="mb-7">
        <h1 className="kz-h2 text-[#1A1410] mb-1">Administration</h1>
        <p className="text-sm text-[#6B5A4A]">Vue globale · Kazajob La Reunion 974</p>
      </div>

      {/* KPI — ligne 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <StatCard label="Utilisateurs"   value={stats.users.toLocaleString('fr-FR')}        color={KZ.violetSoft} icon={<Users size={16} />} />
        <StatCard label="Offres"         value={stats.jobs.toLocaleString('fr-FR')}          color={KZ.orangeSoft} icon={<Briefcase size={16} />} />
        <StatCard label="Entreprises"    value={stats.companies.toLocaleString('fr-FR')}     color={KZ.greenSoft}  icon={<Building2 size={16} />} />
        <StatCard label="Candidatures"   value={stats.applications.toLocaleString('fr-FR')}  color={KZ.yellowSoft} icon={<TrendingUp size={16} />} />
      </div>
      {/* KPI — ligne 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="KazaEvents"     value={stats.events.toLocaleString('fr-FR')}        color={KZ.blueSoft}   icon={<Star size={16} />} />
        <StatCard label="Compétences"    value={stats.skills.toLocaleString('fr-FR')}        color={KZ.cream2}     icon={<BookOpen size={16} />} />
        <StatCard label="Parrainages"    value={stats.referrals.toLocaleString('fr-FR')}     color={KZ.yellowSoft} icon={<Zap size={16} />} />
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-5">
        {/* Offres récentes */}
        <div className="kz-card p-6 bg-white">
          <div className="flex justify-between items-center mb-5">
            <h2 className="kz-h3 text-[#1A1410]">Offres recentes</h2>
            <Link href="/admin/jobs"><Button kind="soft" size="sm">Tout voir</Button></Link>
          </div>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-[#6B5A4A] text-center py-6">Aucune offre publiee pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#1A1410] truncate">{job.title}</div>
                    <div className="text-xs text-[#6B5A4A]">
                      {new Date(job.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <Badge color={job.is_active ? 'green' : 'cream'} size="sm">
                    {job.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4">
          {/* Accès rapides */}
          <div className="kz-card p-5 bg-white">
            <h3 className="kz-h3 text-[#1A1410] mb-4">Acces rapides</h3>
            <div className="flex flex-col gap-2">
              {[
                { href: '/admin/users',         label: 'Gérer les utilisateurs',  color: KZ.violetSoft, icon: <Users size={16} /> },
                { href: '/admin/jobs',          label: 'Modérer les offres',       color: KZ.orangeSoft, icon: <Briefcase size={16} /> },
                { href: '/admin/companies',     label: 'Valider les entreprises',  color: KZ.greenSoft,  icon: <Building2 size={16} /> },
                { href: '/admin/events',        label: 'Gérer KazaEvents',         color: KZ.blueSoft,   icon: <Star size={16} /> },
                { href: '/admin/notifications', label: 'Envoyer une notification', color: KZ.yellowSoft, icon: <Bell size={16} /> },
                { href: '/admin/skills',        label: 'Référentiel compétences',  color: KZ.cream2,     icon: <BookOpen size={16} /> },
                { href: '/admin/analytics',     label: 'Analytics & rapports',     color: KZ.violetSoft, icon: <BarChart2 size={16} /> },
                { href: '/admin/ai',            label: 'KazaIA — Statistiques',    color: KZ.orangeSoft, icon: <Sparkles size={16} /> },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-[#1A1410] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#1A1410]"
                  style={{ background: item.color, boxShadow: '2px 2px 0 #1A1410' }}
                >
                  {item.icon}
                  <span className="text-sm font-bold text-[#1A1410]">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Distribution rôles — données réelles */}
          <div className="kz-card p-5 bg-white">
            <h3 className="kz-h3 text-[#1A1410] mb-4">Distribution des roles</h3>
            {stats.users === 0 ? (
              <p className="text-xs text-[#6B5A4A] text-center py-4">Aucun utilisateur inscrit.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {roleDistrib.map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#1A1410]">{r.label} <span className="text-[#6B5A4A] font-normal">({r.count})</span></span>
                      <span className="text-[#6B5A4A]">{r.pct}%</span>
                    </div>
                    <div className="h-2.5 bg-[#FBEFE0] border border-[#1A1410] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${r.pct}%`, background: r.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
