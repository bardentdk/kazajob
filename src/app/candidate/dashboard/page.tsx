'use client'

import Link from 'next/link'
import { ArrowRight, Eye, Briefcase, Sparkles, Star, Flame, Gamepad2 } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'
import { JobCard } from '@/components/cards/JobCard'
import { ApplicationCard } from '@/components/cards/ApplicationCard'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useAuth } from '@/features/auth/useAuth'
import { useApplications } from '@/features/applications/useApplications'
import { useState, useEffect } from 'react'
import type { Job } from '@/lib/types'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useGamification } from '@/features/gamification/useGamification'
import { GameDashboard } from '@/components/gamification/GameDashboard'
import { KZ } from '@/lib/constants'
import { Soleil } from '@/components/illustrations/Tropical'

function QuizBanner() {
  return (
    <Link href="/candidate/quiz" className="block mb-5">
      <div className="kz-card p-4 flex items-center gap-4 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
        style={{ background: KZ.violetSoft, boxShadow: '4px 4px 0 #1A1410' }}>
        <div className="text-3xl shrink-0">🎮</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-extrabold text-[#1A1410]">Découvre ton profil en 2 min</div>
          <div className="text-xs text-[#6B5A4A]">Un mini-quiz ludique — les recruteurs verront ton style de travail.</div>
        </div>
        <ArrowRight size={18} className="shrink-0" style={{ color: KZ.violet }} />
      </div>
    </Link>
  )
}

export default function CandidateDashboard() {
  const { profile } = useAuth()
  const { applications, loading: appsLoading } = useApplications(profile?.id)
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const { favorites } = useFavorites(profile?.id)
  const gami = useGamification(profile, applications.length, favorites.length)

  useEffect(() => {
    if (!profile?.id) return
    fetch('/api/jobs/recommended?limit=4')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRecommendedJobs(d as Job[]))
      .catch(() => {})
      .finally(() => setJobsLoading(false))
  }, [profile?.id])

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const profileFields = [profile?.full_name, profile?.bio, profile?.location, profile?.phone, profile?.cv_url, profile?.avatar_url]
  const profileScore = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)

  const pendingApps   = applications.filter(a => a.status === 'pending').length
  const interviewApps = applications.filter(a => a.status === 'interview').length

  // ── Mode gamification ────────────────────────────────────────────
  if (gami.enabled && profile) {
    return (
      <div className="max-w-[1100px] mx-auto">
        {!profile.quiz_result && <QuizBanner />}
        <GameDashboard
          profile={profile}
          gami={gami}
          applications={applications}
          appsLoading={appsLoading}
          recommendedJobs={recommendedJobs as Parameters<typeof GameDashboard>[0]['recommendedJobs']}
          jobsLoading={jobsLoading}
          favoritesCount={favorites.length}
        />
      </div>
    )
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      {!profile?.quiz_result && <QuizBanner />}
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="kz-eyebrow mb-1.5" style={{ color: KZ.orange }}>
            Bonzour {profile?.full_name?.split(' ')[0] ?? 'toi'} · <span className="capitalize">{today}</span>
          </p>
          <h1 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-[#1A1410]">
            {recommendedJobs.length > 0
              ? <>{recommendedJobs.length} offre{recommendedJobs.length > 1 ? 's' : ''} <span style={{ color: KZ.orange }}>matchent</span> ton profil.</>
              : <>Bienvenue sur <span style={{ color: KZ.orange }}>Kazajob</span> !</>
            }
          </h1>
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <button
            onClick={() => gami.toggle()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#1A1410] text-xs font-bold transition-all hover:shadow-[2px_2px_0_#1A1410]"
            style={{ background: KZ.violetSoft, color: KZ.violet }}
            title="Activer le mode Quête"
          >
            <Gamepad2 size={14} /> Mode Quête
          </button>
          <Link href="/candidate/jobs" className="shrink-0">
            <Button kind="primary" size="md" iconRight={<ArrowRight size={15} />}>Voir les offres</Button>
          </Link>
        </div>
      </div>

      {/* KPI cards — 2 cols sur mobile, 4 sur desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Candidatures" value={applications.length} delta={pendingApps > 0 ? `${pendingApps} en attente` : undefined} color={KZ.orangeSoft} icon={<Briefcase size={15} />} />
        <StatCard label="Entretiens"   value={interviewApps} delta={interviewApps > 0 ? 'En cours' : undefined}    color={KZ.greenSoft}  icon={<Sparkles size={15} />} />
        <StatCard label="Favoris"      value={favorites.length}                                                      color={KZ.violetSoft} icon={<Star size={15} />} />
        <StatCard label="Profil"       value={`${profileScore}%`} delta={profileScore < 100 ? 'A completer' : 'Complet'} color={KZ.yellowSoft} icon={<Eye size={15} />} />
      </div>

      {/* Layout 2 colonnes sur lg, 1 colonne sur mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-5">
        {/* Colonne principale */}
        <div className="flex flex-col gap-5">
          {/* Profil */}
          <div className="kz-card p-4 md:p-5 bg-white flex gap-4 items-center">
            <Avatar name={profile?.full_name ?? 'KZ'} src={profile?.avatar_url} size={64} color={KZ.orangeSoft} badge />
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-[#1A1410] truncate">{profile?.full_name}</div>
              <div className="text-xs text-[#6B5A4A] mb-2 truncate">
                {profile?.bio ? profile.bio.slice(0, 50) + '…' : 'Complete ton profil'}
                {profile?.location ? ` · ${profile.location}` : ''}
              </div>
              <Progress value={profileScore} color={KZ.orange} />
            </div>
            <Link href="/candidate/profile" className="shrink-0">
              <Button kind="outline" size="sm">Editer</Button>
            </Link>
          </div>

          {/* Offres recommandées */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold flex items-center gap-2 text-[#1A1410]">
                <Sparkles size={18} color={KZ.violet} />Offres pour toi
              </h3>
              <Link href="/candidate/jobs" className="text-sm font-bold" style={{ color: KZ.orange }}>Tout voir →</Link>
            </div>
            {jobsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="kz-card h-32 bg-[#FBEFE0] animate-pulse" />)}
              </div>
            ) : recommendedJobs.length === 0 ? (
              <EmptyState title="Aucune offre disponible" icon={<Briefcase size={24} />} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedJobs.slice(0, 4).map((job) => (
                  <JobCard key={job.id} job={job} compact />
                ))}
              </div>
            )}
          </div>

          {/* Candidatures */}
          <div className="kz-card p-4 md:p-5 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-[#1A1410]">Mes candidatures</h3>
              {applications.length > 0 && <Badge color="orange" size="sm">{applications.length}</Badge>}
            </div>
            {appsLoading ? (
              <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-lg bg-[#FBEFE0] animate-pulse" />)}</div>
            ) : applications.length === 0 ? (
              <EmptyState title="Aucune candidature" icon={<Briefcase size={20} />} action={<Link href="/candidate/jobs"><Button kind="soft" size="sm">Voir les offres</Button></Link>} />
            ) : (
              <>
                {applications.slice(0, 4).map((app) => <ApplicationCard key={app.id} application={app} showActions />)}
                {applications.length > 4 && (
                  <div className="mt-3 pt-3 border-t border-[#E8DDC9]">
                    <Link href="/candidate/applications"><Button kind="soft" size="sm" full>Voir tout</Button></Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Colonne droite — masquée partiellement sur mobile */}
        <div className="flex flex-col gap-4">
          {/* Streak */}
          <div className="p-4 rounded-xl border border-[#1A1410] relative overflow-hidden" style={{ background: KZ.orange, boxShadow: '4px 4px 0 #1A1410' }}>
            <div className="absolute -top-3 -right-3"><Soleil size={70} /></div>
            <Flame size={28} color={KZ.ink} />
            <div className="mt-1 text-4xl font-extrabold leading-none text-[#1A1410]">
              {profile?.streak ?? 0}<span className="text-base opacity-70">j</span>
            </div>
            <div className="text-sm font-semibold mt-1 text-[#1A1410]">Streak actif</div>
            <div className="text-xs mt-1 opacity-85 text-[#1A1410]">
              {(profile?.streak ?? 0) > 0 ? `${profile!.streak} jours — continue !` : 'Connecte-toi chaque jour.'}
            </div>
          </div>

          {/* XP */}
          <div className="kz-card p-4 bg-white">
            <div className="kz-eyebrow text-[#6B5A4A] mb-1.5">Experience totale</div>
            <div className="text-2xl font-extrabold tracking-tight text-[#1A1410] mb-2">
              {(profile?.xp ?? 0).toLocaleString('fr-FR')} xp
            </div>
            <Progress value={((profile?.xp ?? 0) % 1000) / 10} color={KZ.orange} label={`Niveau ${Math.floor((profile?.xp ?? 0) / 1000) + 1}`} />
          </div>

          {/* Stats */}
          <div className="kz-card p-4 bg-white">
            <h4 className="text-sm font-bold text-[#1A1410] mb-3">Ton activite</h4>
            {[
              { label: 'Candidatures', value: applications.length, color: KZ.orange },
              { label: 'Entretiens',   value: interviewApps,       color: KZ.green },
              { label: 'Favoris',      value: favorites.length,    color: KZ.violet },
            ].map((s) => (
              <div key={s.label} className="flex justify-between items-center py-2 border-b border-[#E8DDC9] last:border-0">
                <span className="text-xs text-[#6B5A4A]">{s.label}</span>
                <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
