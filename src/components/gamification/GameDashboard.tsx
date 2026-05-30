'use client'

import Link from 'next/link'
import {
  User, FileText, Zap, Video, Send, Target, Heart, Flame, TrendingUp,
  Star, Briefcase, ArrowRight, CheckCircle2, Lock, Crown, Sparkles,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { JobCard } from '@/components/cards/JobCard'
import { ApplicationCard } from '@/components/cards/ApplicationCard'
import { EmptyState } from '@/components/feedback/EmptyState'
import { KZ } from '@/lib/constants'
import type { Profile, Application } from '@/lib/types'
import type { Job } from '@/lib/types'
import type { GamificationData, Quest } from '@/features/gamification/useGamification'

// ── Map icônes ────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  User:        <User       size={16} />,
  FileText:    <FileText   size={16} />,
  Zap:         <Zap        size={16} />,
  Video:       <Video      size={16} />,
  Send:        <Send       size={16} />,
  Target:      <Target     size={16} />,
  Heart:       <Heart      size={16} />,
  Flame:       <Flame      size={16} />,
  TrendingUp:  <TrendingUp size={16} />,
}

// ── Carte quête individuelle ──────────────────────────────────────
function QuestCard({ quest }: { quest: Quest }) {
  const done = quest.completed

  return (
    <div
      className="relative rounded-2xl border-2 border-[#1A1410] overflow-hidden transition-all"
      style={{
        background: done ? '#1A1410' : KZ.paper,
        boxShadow: done ? 'none' : '4px 4px 0 #1A1410',
      }}
    >
      {/* Accent top bar */}
      <div className="h-1" style={{ background: quest.accentColor }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-[#1A1410] flex items-center justify-center shrink-0"
              style={{ background: done ? quest.accentColor + '30' : quest.accentColor, color: done ? quest.accentColor : '#1A1410' }}
            >
              {ICON_MAP[quest.iconName]}
            </div>
            <div>
              <div className="text-xs font-extrabold leading-tight" style={{ color: done ? 'rgba(255,247,238,0.9)' : '#1A1410' }}>
                {quest.title}
              </div>
            </div>
          </div>
          <div
            className="shrink-0 text-[10px] font-extrabold px-2 py-1 rounded-full border border-[#1A1410]"
            style={{ background: quest.accentColor, color: '#1A1410' }}
          >
            +{quest.xpReward} XP
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] mb-3 leading-relaxed" style={{ color: done ? 'rgba(255,247,238,0.55)' : '#6B5A4A' }}>
          {quest.desc}
        </p>

        {/* Progress bar */}
        {done ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} color={KZ.green} />
            <span className="text-[11px] font-bold" style={{ color: KZ.green }}>Quête accomplie !</span>
          </div>
        ) : (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold" style={{ color: '#6B5A4A' }}>Progression</span>
              <span className="text-[10px] font-extrabold" style={{ color: quest.accentColor }}>{quest.progress}%</span>
            </div>
            <div className="h-2.5 rounded-full border border-[#1A1410] overflow-hidden" style={{ background: KZ.cream2 }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(quest.progress, 2)}%`, background: quest.accentColor }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── XP Progress bar ───────────────────────────────────────────────
function XpBar({ xp, xpProgress, level, nextLevel }: {
  xp: number; xpProgress: number
  level: { title: string; color: string; emoji: string }
  nextLevel: { title: string; minXp: number; color: string; emoji: string }
}) {
  return (
    <div
      className="rounded-2xl border-2 border-[#1A1410] p-4 mb-5"
      style={{ background: '#1A1410', boxShadow: '5px 5px 0 ' + level.color }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{level.emoji}</span>
          <div>
            <div className="text-xs font-bold opacity-60" style={{ color: KZ.cream }}>NIVEAU ACTUEL</div>
            <div className="text-base font-extrabold tracking-tight" style={{ color: level.color }}>{level.title}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold" style={{ color: KZ.cream }}>
            {xp.toLocaleString('fr-FR')} <span className="text-sm opacity-60">XP</span>
          </div>
          <div className="text-[10px] opacity-50" style={{ color: KZ.cream }}>
            → {nextLevel.minXp.toLocaleString('fr-FR')} XP pour {nextLevel.emoji} {nextLevel.title}
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="h-4 rounded-full border border-white/20 overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div
          className="h-full rounded-full relative overflow-hidden transition-all duration-1000"
          style={{ width: `${xpProgress}%`, background: `linear-gradient(90deg, ${level.color}, ${level.color}cc)` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
        <div
          className="absolute inset-y-0 flex items-center justify-center text-[10px] font-extrabold w-full"
          style={{ color: xpProgress > 50 ? '#1A1410' : KZ.cream }}
        >
          {xpProgress}% vers {nextLevel.title}
        </div>
      </div>
    </div>
  )
}

// ── Badge de niveau (compact) ─────────────────────────────────────
function LevelPill({ level, xp }: { level: { level: number; title: string; color: string; emoji: string }; xp: number }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-[#1A1410] text-sm font-extrabold"
      style={{ background: level.color, color: '#1A1410', boxShadow: '2px 2px 0 #1A1410' }}
    >
      <span>{level.emoji}</span>
      <span>Niv.{level.level} {level.title}</span>
      <span className="opacity-70 text-xs">· {xp.toLocaleString()} XP</span>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────
interface GameDashboardProps {
  profile: Profile
  gami: GamificationData
  applications: Application[]
  appsLoading: boolean
  recommendedJobs: Job[]
  jobsLoading: boolean
  favoritesCount: number
}

// ── Composant principal ───────────────────────────────────────────
export function GameDashboard({
  profile, gami, applications, appsLoading, recommendedJobs, jobsLoading, favoritesCount,
}: GameDashboardProps) {
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const firstName = profile.full_name?.split(' ')[0] ?? 'toi'
  const pendingApps   = applications.filter(a => a.status === 'pending').length
  const interviewApps = applications.filter(a => a.status === 'interview').length

  return (
    <div className="max-w-[1100px] mx-auto">

      {/* ── Header avec level ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <p className="kz-eyebrow mb-1" style={{ color: gami.level.color }}>
            Mode Quête · <span className="capitalize">{today}</span>
          </p>
          <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">
            Salut {firstName} <span style={{ color: gami.level.color }}>{gami.level.emoji}</span>
          </h1>
          <div className="mt-2">
            <LevelPill level={gami.level} xp={gami.xp} />
          </div>
        </div>
        <Link href="/candidate/jobs" className="shrink-0">
          <Button kind="primary" size="md" iconRight={<ArrowRight size={15} />}>Explorer les offres</Button>
        </Link>
      </div>

      {/* ── XP Bar ─────────────────────────────────────────────── */}
      <XpBar xp={gami.xp} xpProgress={gami.xpProgress} level={gami.level} nextLevel={gami.nextLevel} />

      {/* ── Stats HUD ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { icon: <Flame  size={18} />, label: 'Streak', value: gami.streak + 'j', color: KZ.yellow,     bg: KZ.yellowSoft },
          { icon: <Briefcase size={18}/>,label:'Candidatures',value:applications.length,color:KZ.orange,bg:KZ.orangeSoft },
          { icon: <Star   size={18} />, label: 'Quêtes OK',  value: gami.doneQuests.length + '/' + gami.quests.length, color: KZ.green,  bg: KZ.greenSoft  },
          { icon: <Heart  size={18} />, label: 'Favoris', value: favoritesCount, color: KZ.violet,    bg: KZ.violetSoft },
        ].map(s => (
          <div key={s.label}
            className="rounded-2xl border-2 border-[#1A1410] p-4 text-center"
            style={{ background: s.bg, boxShadow: '3px 3px 0 #1A1410' }}
          >
            <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
            <div className="text-xl font-extrabold text-[#1A1410]">{s.value}</div>
            <div className="text-[10px] font-bold text-[#6B5A4A] uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Layout 2 colonnes ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">

        {/* Colonne gauche — Quêtes + Offres */}
        <div className="flex flex-col gap-5">

          {/* Quêtes actives */}
          {gami.activeQuests.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-extrabold text-[#1A1410] flex items-center gap-2">
                  <Sparkles size={17} color={KZ.violet} />
                  Quêtes actives
                  <Badge color="violet" size="sm">{gami.activeQuests.length}</Badge>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gami.activeQuests.map(q => <QuestCard key={q.id} quest={q} />)}
              </div>
            </div>
          )}

          {/* Offres recommandées */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-extrabold text-[#1A1410] flex items-center gap-2">
                <Target size={17} color={KZ.orange} />
                Missions disponibles
              </h2>
              <Link href="/candidate/jobs" className="text-sm font-bold" style={{ color: KZ.orange }}>Tout voir →</Link>
            </div>
            {jobsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl bg-[#FBEFE0] animate-pulse" />)}
              </div>
            ) : recommendedJobs.length === 0 ? (
              <EmptyState title="Aucune mission disponible" icon={<Briefcase size={24} />} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedJobs.slice(0, 4).map(job => <JobCard key={job.id} job={job} compact />)}
              </div>
            )}
          </div>

          {/* Candidatures */}
          {applications.length > 0 && (
            <div
              className="rounded-2xl border-2 border-[#1A1410] overflow-hidden"
              style={{ boxShadow: '4px 4px 0 #1A1410' }}
            >
              <div className="px-5 py-3 flex justify-between items-center" style={{ background: '#1A1410' }}>
                <h3 className="text-sm font-extrabold flex items-center gap-2" style={{ color: KZ.cream }}>
                  <Send size={15} color={KZ.orange} />
                  Candidatures en cours
                </h3>
                <Badge color="orange" size="sm">{applications.length}</Badge>
              </div>
              <div className="bg-white p-3 flex flex-col gap-2">
                {appsLoading ? (
                  [1,2].map(i => <div key={i} className="h-12 rounded-lg bg-[#FBEFE0] animate-pulse" />)
                ) : (
                  applications.slice(0, 3).map(app => <ApplicationCard key={app.id} application={app} />)
                )}
                {applications.length > 3 && (
                  <Link href="/candidate/applications">
                    <Button kind="soft" size="sm" full>Voir tout ({applications.length})</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite — Profil + Quêtes accomplies */}
        <div className="flex flex-col gap-4">

          {/* Profil héros */}
          <div
            className="rounded-2xl border-2 border-[#1A1410] overflow-hidden"
            style={{ background: '#1A1410', boxShadow: '4px 4px 0 ' + gami.level.color }}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <Avatar name={profile.full_name} src={profile.avatar_url} size={56} color={gami.level.bg} />
                  {/* Level ring */}
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[#1A1410] flex items-center justify-center text-[10px] font-extrabold"
                    style={{ background: gami.level.color, color: '#1A1410' }}
                  >
                    {gami.level.level}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold truncate" style={{ color: KZ.cream }}>{profile.full_name}</div>
                  <div className="text-[11px] opacity-60" style={{ color: KZ.cream }}>{profile.location ?? 'La Réunion 974'}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Flame size={11} color={KZ.yellow} fill={KZ.yellow} />
                    <span className="text-[10px] font-bold" style={{ color: KZ.yellow }}>{gami.streak} jours de streak</span>
                  </div>
                </div>
              </div>
              <Link href="/candidate/profile">
                <Button kind="primary" size="sm" full>Améliorer mon profil +XP</Button>
              </Link>
            </div>
          </div>

          {/* Quêtes accomplies */}
          {gami.doneQuests.length > 0 && (
            <div className="kz-card p-4 bg-white">
              <h3 className="text-sm font-extrabold text-[#1A1410] mb-3 flex items-center gap-2">
                <CheckCircle2 size={15} color={KZ.green} />
                Quêtes accomplies ({gami.doneQuests.length})
              </h3>
              <div className="flex flex-col gap-2">
                {gami.doneQuests.map(q => (
                  <div key={q.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E8DDC9]"
                    style={{ background: KZ.cream2 }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: q.accentColor + '20', color: q.accentColor }}>
                      {ICON_MAP[q.iconName]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#1A1410] truncate">{q.title}</div>
                    </div>
                    <div className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#1A1410]"
                      style={{ background: KZ.greenSoft, color: KZ.green }}>
                      +{q.xpReward} XP
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quêtes verrouillées */}
          {gami.doneQuests.length === gami.quests.length && (
            <div
              className="rounded-2xl border-2 border-[#1A1410] p-5 text-center"
              style={{ background: KZ.yellowSoft, boxShadow: '3px 3px 0 #1A1410' }}
            >
              <Crown size={32} color={KZ.yellow} className="mx-auto mb-2" />
              <div className="text-sm font-extrabold text-[#1A1410]">Toutes les quêtes accomplies !</div>
              <div className="text-xs text-[#6B5A4A] mt-1">Tu es un vrai Expert 974.</div>
            </div>
          )}

          {/* Prochaines récompenses */}
          <div
            className="rounded-2xl border-2 border-[#1A1410] p-4"
            style={{ background: KZ.violetSoft, boxShadow: '3px 3px 0 #1A1410' }}
          >
            <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: KZ.violet }}>
              Prochaine récompense
            </p>
            {gami.activeQuests[0] ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border border-[#1A1410] flex items-center justify-center"
                  style={{ background: gami.activeQuests[0].accentColor + '30', color: gami.activeQuests[0].accentColor }}>
                  {ICON_MAP[gami.activeQuests[0].iconName]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#1A1410]">{gami.activeQuests[0].title}</div>
                  <div className="text-xs text-[#6B5A4A]">+{gami.activeQuests[0].xpReward} XP</div>
                </div>
                <div className="text-lg font-extrabold" style={{ color: KZ.violet }}>
                  {gami.activeQuests[0].progress}%
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#6B5A4A]">Tout accompli — tu es une légende.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
