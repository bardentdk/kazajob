'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Calendar, Video, Phone, MapPin, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import { useInterviews } from '@/features/interviews/useInterviews'
import { useStartConversation } from '@/features/messages/useMessages'
import type { Application, BadgeColor } from '@/lib/types'
import { APPLICATION_STATUSES, KZ } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'

export default function RecruiterApplicationsPage() {
  const { profile } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [scheduleFor, setScheduleFor] = useState<Application | null>(null)
  const [scheduleData, setScheduleData] = useState({
    scheduledAt: '', durationMin: '45', type: 'video' as 'video'|'phone'|'onsite',
    visioType: 'jitsi' as 'jitsi'|'external', externalLink: '', location: '', notes: '',
  })
  const [scheduling, setScheduling] = useState(false)
  const [messagingId, setMessagingId] = useState<string | null>(null)
  const { create: createInterview } = useInterviews()
  const startConversation = useStartConversation()
  const router = useRouter()

  const handleMessage = async (candidateId: string, jobId: string) => {
    if (!profile?.id) return
    setMessagingId(candidateId)
    const convId = await startConversation(candidateId, profile.id, jobId)
    if (convId) router.push(`/recruiter/messages?c=${convId}`)
    setMessagingId(null)
  }

  useEffect(() => {
    if (!profile) return
    const fetchApps = async () => {
      try {
        const res = await fetch('/api/applications?scope=recruiter')
        let data = res.ok ? ((await res.json()) as Application[]) : []
        if (filterStatus) data = data.filter((a) => a.status === filterStatus)
        setApplications(data)
      } catch { /* noop */ }
      setLoading(false)
    }
    fetchApps()
  }, [profile, filterStatus])

  const handleSchedule = async () => {
    if (!scheduleFor || !scheduleData.scheduledAt) return
    setScheduling(true)
    await createInterview({
      applicationId: scheduleFor.id,
      candidateId:   scheduleFor.candidate_id,
      jobId:         scheduleFor.job_id,
      scheduledAt:   new Date(scheduleData.scheduledAt).toISOString(),
      durationMin:   parseInt(scheduleData.durationMin),
      type:          scheduleData.type,
      visioType:     scheduleData.visioType,
      externalLink:  scheduleData.externalLink || undefined,
      location:      scheduleData.location || undefined,
      notes:         scheduleData.notes || undefined,
    })
    setScheduling(false)
    setScheduleFor(null)
    // Rafraîchir
    setApplications(prev => prev.map(a => a.id === scheduleFor.id ? { ...a, status: 'interview' } : a))
  }

  const updateStatus = async (id: string, status: Application['status']) => {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
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
                    <Button kind="soft" size="sm" icon={<MessageCircle size={13} />}
                      loading={messagingId === candidate.id}
                      onClick={() => handleMessage(candidate.id, app.job_id)}>
                      Message
                    </Button>
                  )}
                  {candidate && (
                    <Button kind="soft" size="sm" icon={<Calendar size={13} />} onClick={() => setScheduleFor(app)}>
                      Entretien
                    </Button>
                  )}
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

      {/* Modal planification entretien */}
      <Modal open={!!scheduleFor} onClose={() => setScheduleFor(null)} title="Planifier un entretien" size="md">
        <div className="flex flex-col gap-4">
          <div className="p-3 rounded-xl border border-[#1A1410]" style={{ background: KZ.violetSoft }}>
            <div className="text-sm font-bold text-[#1A1410]">{scheduleFor?.job?.title}</div>
            <div className="text-xs text-[#6B5A4A]">
              Candidat : {(scheduleFor?.candidate as { full_name?: string })?.full_name}
            </div>
          </div>

          <Input label="Date et heure *" type="datetime-local" value={scheduleData.scheduledAt}
            onChange={e => setScheduleData(d => ({ ...d, scheduledAt: e.target.value }))} required />

          <div className="grid grid-cols-2 gap-3">
            <Select label="Durée" options={[
              { value: '30', label: '30 min' }, { value: '45', label: '45 min' },
              { value: '60', label: '1 heure' }, { value: '90', label: '1h30' },
            ]} value={scheduleData.durationMin} onChange={e => setScheduleData(d => ({ ...d, durationMin: e.target.value }))} />

            <Select label="Type" options={[
              { value: 'video',  label: 'Visioconférence' },
              { value: 'phone',  label: 'Téléphone' },
              { value: 'onsite', label: 'Présentiel' },
            ]} value={scheduleData.type} onChange={e => setScheduleData(d => ({ ...d, type: e.target.value as 'video'|'phone'|'onsite' }))} />
          </div>

          {scheduleData.type === 'video' && (
            <div>
              <Select label="Outil visio" options={[
                { value: 'jitsi',    label: 'Jitsi Meet (lien auto-généré)' },
                { value: 'external', label: 'Mon propre lien' },
              ]} value={scheduleData.visioType} onChange={e => setScheduleData(d => ({ ...d, visioType: e.target.value as 'jitsi'|'external' }))} />
              {scheduleData.visioType === 'external' && (
                <Input label="Lien visio" className="mt-3" value={scheduleData.externalLink}
                  placeholder="https://meet.google.com/..."
                  onChange={e => setScheduleData(d => ({ ...d, externalLink: e.target.value }))} />
              )}
            </div>
          )}

          {scheduleData.type === 'onsite' && (
            <Input label="Lieu" value={scheduleData.location}
              placeholder="12 Rue de Paris, Saint-Denis"
              onChange={e => setScheduleData(d => ({ ...d, location: e.target.value }))} />
          )}

          <Textarea label="Notes pour le candidat" value={scheduleData.notes} rows={3}
            placeholder="Ce que le candidat doit savoir avant l'entretien..."
            onChange={e => setScheduleData(d => ({ ...d, notes: e.target.value }))} />

          <div className="text-xs text-[#6B5A4A] p-2.5 rounded-lg border border-[#E8DDC9]" style={{ background: KZ.greenSoft }}>
            Les deux parties recevront un email de confirmation avec tous les détails.
          </div>

          <div className="flex gap-3">
            <Button kind="soft" size="lg" full onClick={() => setScheduleFor(null)}>Annuler</Button>
            <Button kind="primary" size="lg" full loading={scheduling} onClick={handleSchedule}
              disabled={!scheduleData.scheduledAt}>
              Planifier et envoyer les invitations
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
