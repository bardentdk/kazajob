'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Mail, Phone, Download, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import { useStartConversation } from '@/features/messages/useMessages'
import { ARCHETYPES, type ArchetypeKey } from '@/lib/quiz'
import type { Profile, Application } from '@/lib/types'
import { APPLICATION_STATUSES, KZ } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import { Play } from 'lucide-react'
import type { BadgeColor } from '@/lib/types'

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const startConversation = useStartConversation()
  const [candidate, setCandidate] = useState<Profile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(false)
  const router = useRouter()

  const handleMessage = async () => {
    if (!profile?.id || !candidate) return
    setMessaging(true)
    const convId = await startConversation(candidate.id, profile.id)
    if (convId) router.push(`/recruiter/messages?c=${convId}`)
    setMessaging(false)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/profiles/${id}`)
        if (res.ok) {
          const { profile, applications: apps } = await res.json()
          if (profile) setCandidate(profile as Profile)
          if (apps) setApplications(apps as Application[])
        }
      } catch { /* noop */ }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <PageLoader />
  if (!candidate) return <div className="text-center py-16 text-[#6B5A4A]">Candidat introuvable.</div>

  return (
    <div className="max-w-[800px] mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-[#6B5A4A] hover:text-[#1A1410] mb-6">
        <ArrowLeft size={16} />
        Retour
      </button>

      <div className="grid grid-cols-[260px_1fr] gap-5">
        {/* Left */}
        <div className="flex flex-col gap-4">
          <div className="kz-card p-5 bg-white text-center">
            <div className="flex justify-center mb-3">
              <Avatar name={candidate.full_name} src={candidate.avatar_url} size={72} color={KZ.orangeSoft} />
            </div>
            <h2 className="text-lg font-bold text-[#1A1410]">{candidate.full_name}</h2>
            {candidate.location && (
              <div className="flex items-center justify-center gap-1 text-sm text-[#6B5A4A] mt-1">
                <MapPin size={13} /> {candidate.location}
              </div>
            )}
            {/* Pitch vidéo */}
            {(() => {
              const pitchUrl = (candidate as unknown as Record<string,unknown>).video_pitch_url as string | null
              if (!pitchUrl) return null
              return (
                <div className="mt-4">
                  <div className="text-xs font-bold text-[#6B5A4A] mb-2 flex items-center gap-1.5">
                    <Play size={11} /> Pitch vidéo du candidat
                  </div>
                  <video
                    src={pitchUrl}
                    controls
                    className="w-full rounded-xl border border-[#1A1410] bg-black"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )
            })()}

            <div className="mt-4 flex flex-col gap-2">
              {candidate.cv_url && (
                <a href={candidate.cv_url} target="_blank" rel="noreferrer">
                  <Button kind="primary" size="sm" full icon={<Download size={14} />}>
                    Telecharger le CV
                  </Button>
                </a>
              )}
              <Button kind="outline" size="sm" full icon={<MessageCircle size={14} />}
                loading={messaging} onClick={handleMessage}>
                Envoyer un message
              </Button>
            </div>
          </div>

          <div className="kz-card p-5 bg-white">
            <div className="kz-eyebrow text-[#6B5A4A] mb-3">Contact</div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-[#1A1410]">
                <Mail size={14} className="text-[#6B5A4A]" />
                {candidate.email}
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-2 text-sm text-[#1A1410]">
                  <Phone size={14} className="text-[#6B5A4A]" />
                  {candidate.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-4">
          {/* Indicateur profil (quiz) */}
          {candidate.quiz_result?.archetype && ARCHETYPES[candidate.quiz_result.archetype as ArchetypeKey] && (() => {
            const a = ARCHETYPES[candidate.quiz_result.archetype as ArchetypeKey]
            return (
              <div className="kz-card p-5 bg-white" style={{ boxShadow: `4px 4px 0 ${a.color}` }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{a.emoji}</span>
                  <div>
                    <div className="kz-eyebrow" style={{ color: a.color }}>Profil candidat</div>
                    <div className="text-base font-extrabold text-[#1A1410]">{a.label}</div>
                  </div>
                </div>
                <p className="text-sm text-[#2A2018] leading-relaxed">{a.recruiterHint}</p>
              </div>
            )
          })()}

          {candidate.bio && (
            <div className="kz-card p-5 bg-white">
              <h3 className="kz-h3 text-[#1A1410] mb-3">Bio</h3>
              <p className="text-sm leading-relaxed text-[#2A2018]">{candidate.bio}</p>
            </div>
          )}

          <div className="kz-card p-5 bg-white">
            <h3 className="kz-h3 text-[#1A1410] mb-3">Stats</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { v: candidate.xp?.toLocaleString('fr-FR') ?? '—', l: 'XP total' },
                { v: candidate.streak ?? 0, l: 'Streak jours' },
                { v: applications.length, l: 'Candidatures' },
              ].map((s) => (
                <div key={s.l} className="text-center p-3 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                  <div className="text-2xl font-extrabold text-[#1A1410]">{String(s.v)}</div>
                  <div className="text-xs text-[#6B5A4A] mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {applications.length > 0 && (
            <div className="kz-card p-5 bg-white">
              <h3 className="kz-h3 text-[#1A1410] mb-3">Candidatures</h3>
              <div className="flex flex-col gap-2">
                {applications.map((app) => {
                  const statusInfo = APPLICATION_STATUSES[app.status] ?? { label: app.status, color: 'cream' }
                  return (
                    <div key={app.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-[#1A1410]">{app.job?.title}</div>
                        <div className="text-xs text-[#6B5A4A]">{app.job?.company?.name} · {timeAgo(app.created_at)}</div>
                      </div>
                      <Badge color={statusInfo.color as BadgeColor} size="sm">{statusInfo.label}</Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
