'use client'

import Link from 'next/link'
import { ArrowRight, Eye, Briefcase, Sparkles, Star, Flame } from 'lucide-react'
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
import { useJobs } from '@/features/jobs/useJobs'
import { useFavorites } from '@/features/favorites/useFavorites'
import { KZ } from '@/lib/constants'
import { Soleil } from '@/components/illustrations/Tropical'

export default function CandidateDashboard() {
  const { profile } = useAuth()
  const { applications, loading: appsLoading } = useApplications(profile?.id)
  const { jobs: recommendedJobs, loading: jobsLoading } = useJobs({ limit: 4 })
  const { favorites } = useFavorites(profile?.id)

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  // Score de complétion du profil
  const profileFields = [profile?.full_name, profile?.bio, profile?.location, profile?.phone, profile?.cv_url, profile?.avatar_url]
  const profileScore = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)

  // Stats réelles
  const pendingApps   = applications.filter(a => a.status === 'pending').length
  const interviewApps = applications.filter(a => a.status === 'interview').length

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Greeting */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="kz-eyebrow mb-1.5" style={{ color: KZ.orange }}>
            Bonzour {profile?.full_name?.split(' ')[0] ?? 'toi'} · {today}
          </p>
          <h1 className="kz-h2 text-[#1A1410]">
            {recommendedJobs.length > 0
              ? <>{recommendedJobs.length} offre{recommendedJobs.length > 1 ? 's' : ''} <span style={{ color: KZ.orange }}>matchent</span> ton profil.</>
              : <>Bienvenue sur <span style={{ color: KZ.orange }}>Kazajob</span> !</>
            }
          </h1>
        </div>
        <Link href="/candidate/jobs">
          <Button kind="primary" size="lg" iconRight={<ArrowRight size={16} />}>Voir les offres</Button>
        </Link>
      </div>

      {/* KPI cards — données réelles */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Candidatures"
          value={applications.length}
          delta={applications.length > 0 ? `${pendingApps} en attente` : 'Aucune encore'}
          color={KZ.orangeSoft}
          icon={<Briefcase size={16} />}
        />
        <StatCard
          label="Entretiens"
          value={interviewApps}
          delta={interviewApps > 0 ? 'En cours' : 'Aucun planifie'}
          color={KZ.greenSoft}
          icon={<Sparkles size={16} />}
        />
        <StatCard
          label="Favoris"
          value={favorites.length}
          delta={favorites.length > 0 ? 'Offres sauvegardees' : 'Aucun favori'}
          color={KZ.violetSoft}
          icon={<Star size={16} />}
        />
        <StatCard
          label="Profil complete"
          value={`${profileScore}%`}
          delta={profileScore < 100 ? 'A completer' : 'Profil complet'}
          color={KZ.yellowSoft}
          icon={<Eye size={16} />}
        />
      </div>

      <div className="grid grid-cols-[1.7fr_1fr] gap-5">
        {/* Colonne principale */}
        <div className="flex flex-col gap-5">
          {/* Profil progress */}
          <div className="kz-card p-5 bg-white flex gap-5 items-center">
            <Avatar name={profile?.full_name ?? 'KZ'} src={profile?.avatar_url} size={80} color={KZ.orangeSoft} badge />
            <div className="flex-1">
              <div className="text-base font-bold text-[#1A1410] mb-0.5">{profile?.full_name}</div>
              <div className="text-sm text-[#6B5A4A] mb-3">
                {profile?.bio ? profile.bio.slice(0, 60) + (profile.bio.length > 60 ? '...' : '') : 'Complete ton profil pour de meilleurs matches'}
                {profile?.location ? ` · ${profile.location}` : ''}
              </div>
              <Progress value={profileScore} color={KZ.orange} label="Profil complete" />
            </div>
            <Link href="/candidate/profile">
              <Button kind="outline" size="sm">Completer</Button>
            </Link>
          </div>

          {/* Offres recommandées — données réelles de useJobs */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="kz-h3 flex items-center gap-2.5 text-[#1A1410]">
                <Sparkles size={20} color={KZ.violet} />
                Offres pour toi
              </h3>
              <Link href="/candidate/jobs" className="text-sm font-bold" style={{ color: KZ.orange }}>
                Tout voir →
              </Link>
            </div>
            {jobsLoading ? (
              <div className="grid grid-cols-2 gap-3.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="kz-card h-36 bg-[#FBEFE0] animate-pulse" />
                ))}
              </div>
            ) : recommendedJobs.length === 0 ? (
              <EmptyState
                title="Aucune offre disponible"
                description="Sois le premier a postuler quand les recruteurs publieront des offres."
                icon={<Briefcase size={24} />}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {recommendedJobs.slice(0, 4).map((job) => (
                  <JobCard key={job.id} job={job} compact />
                ))}
              </div>
            )}
          </div>

          {/* Candidatures récentes */}
          <div className="kz-card p-5 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="kz-h3 text-[#1A1410]">Mes candidatures</h3>
              {applications.length > 0 && (
                <Badge color="orange">{applications.length} au total</Badge>
              )}
            </div>

            {appsLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-[#FBEFE0] animate-pulse" />
                ))}
              </div>
            ) : applications.length === 0 ? (
              <EmptyState
                title="Aucune candidature"
                description="Postule a des offres pour les voir apparaitre ici."
                icon={<Briefcase size={22} />}
                action={<Link href="/candidate/jobs"><Button kind="soft" size="sm">Voir les offres</Button></Link>}
              />
            ) : (
              <>
                {applications.slice(0, 4).map((app) => (
                  <ApplicationCard key={app.id} application={app} showActions />
                ))}
                {applications.length > 4 && (
                  <div className="mt-3 pt-3 border-t border-[#E8DDC9]">
                    <Link href="/candidate/applications">
                      <Button kind="soft" size="sm" full>Voir toutes mes candidatures</Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Colonne droite — gamification */}
        <div className="flex flex-col gap-4">
          {/* Streak */}
          <div
            className="p-5 rounded-xl border border-[#1A1410] relative overflow-hidden"
            style={{ background: KZ.orange, boxShadow: '4px 4px 0 #1A1410' }}
          >
            <div className="absolute -top-3 -right-3"><Soleil size={80} /></div>
            <Flame size={32} color={KZ.ink} />
            <div className="mt-2 text-[44px] font-extrabold leading-none text-[#1A1410]">
              {profile?.streak ?? 0}
              <span className="text-lg opacity-70">j</span>
            </div>
            <div className="text-sm font-semibold mt-1 text-[#1A1410]">Streak actif</div>
            <div className="text-xs mt-2 opacity-85 text-[#1A1410]">
              {(profile?.streak ?? 0) > 0
                ? `${profile!.streak} jours d'affilee — continue !`
                : 'Connecte-toi chaque jour pour lancer ton streak.'}
            </div>
          </div>

          {/* XP */}
          <div className="kz-card p-5 bg-white">
            <div className="kz-eyebrow text-[#6B5A4A] mb-2">Experience totale</div>
            <div className="text-3xl font-extrabold tracking-tight text-[#1A1410] mb-3">
              {(profile?.xp ?? 0).toLocaleString('fr-FR')} xp
            </div>
            <Progress
              value={((profile?.xp ?? 0) % 1000) / 10}
              color={KZ.orange}
              label={`Niveau ${Math.floor((profile?.xp ?? 0) / 1000) + 1}`}
            />
            <div className="mt-2 text-xs text-[#6B5A4A]">
              {1000 - ((profile?.xp ?? 0) % 1000)} xp pour le prochain niveau
            </div>
          </div>

          {/* Stats résumé */}
          <div className="kz-card p-5 bg-white">
            <h4 className="text-sm font-bold text-[#1A1410] mb-3">Ton activite</h4>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Candidatures envoyees', value: applications.length, color: KZ.orange },
                { label: 'Entretiens obtenus', value: interviewApps, color: KZ.green },
                { label: 'Offres sauvegardees', value: favorites.length, color: KZ.violet },
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
    </div>
  )
}
