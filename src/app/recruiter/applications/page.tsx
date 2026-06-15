'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Calendar, Video, Phone, MapPin, MessageCircle, Sparkles, Lock, Check, AlertTriangle, Rocket, Bookmark } from 'lucide-react'
import { InlineLoader } from '@/components/ui/LogoLoader'
import { Tag } from '@/components/ui/Tag'
import { Progress } from '@/components/ui/Progress'
import { useApplicationSummaryAI } from '@/features/ai/useKazaIA'
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
import { APPLICATION_STATUSES, KZ, TALENT_POOL_CATEGORIES } from '@/lib/constants'
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
  const [summaryFor, setSummaryFor] = useState<Application | null>(null)
  const [poolFor, setPoolFor] = useState<Application | null>(null)
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-[#1A1410]">{candidate?.full_name}</span>
                    {(() => {
                      const bu = (candidate as unknown as { boosted_until?: string | null })?.boosted_until
                      return bu && new Date(bu) > new Date() ? (
                        <Badge color="orange" size="sm"><span className="flex items-center gap-1"><Rocket size={10} />Mis en avant</span></Badge>
                      ) : null
                    })()}
                  </div>
                  <div className="text-sm text-[#6B5A4A]">
                    {app.job?.title} · {app.job?.company?.name} · {timeAgo(app.created_at)}
                  </div>
                  {app.cover_letter && (
                    <p className="text-xs text-[#6B5A4A] mt-1 line-clamp-1">{app.cover_letter}</p>
                  )}
                  {(() => {
                    const ans = (app as unknown as { prequal_answers?: { label: string; value: string }[] }).prequal_answers
                    return ans && ans.some((a) => a.value) ? (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {ans.filter((a) => a.value).map((a, i) => (
                          <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                            {a.label} : <strong className="text-[#1A1410]">{a.value}</strong>
                          </span>
                        ))}
                      </div>
                    ) : null
                  })()}
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
                  <Button kind="violet" size="sm" icon={<Sparkles size={13} />}
                    onClick={() => setSummaryFor(app)}>
                    Synthèse IA
                  </Button>
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
                    <Button kind="soft" size="sm" icon={<Bookmark size={13} />} onClick={() => setPoolFor(app)}>
                      Vivier
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

      {/* Modal synthèse IA candidature */}
      <ApplicationSummaryModal app={summaryFor} onClose={() => setSummaryFor(null)} />

      {/* Modal sauvegarde dans le vivier */}
      <SaveToPoolModal app={poolFor} onClose={() => setPoolFor(null)} />
    </div>
  )
}

// ── Modal "Sauvegarder dans le vivier" ─────────────────────────
function SaveToPoolModal({ app, onClose }: { app: Application | null; onClose: () => void }) {
  const [category, setCategory] = useState<string>('a_contacter')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const candidate = app?.candidate as { id?: string; full_name?: string } | undefined

  const save = async () => {
    if (!candidate?.id) return
    setLoading(true)
    await fetch('/api/recruiter/talent-pool', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: candidate.id, category, note: note || null }),
    })
    setLoading(false); setDone(true)
  }

  const handleClose = () => { setDone(false); setNote(''); setCategory('a_contacter'); onClose() }

  return (
    <Modal open={!!app} onClose={handleClose} title="Sauvegarder dans le vivier" size="sm">
      {done ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-14 h-14 rounded-full border-2 border-[#1A1410] flex items-center justify-center" style={{ background: KZ.greenSoft }}>
            <Check size={24} color={KZ.green} />
          </div>
          <p className="text-sm font-bold text-[#1A1410]">{candidate?.full_name} ajouté au vivier.</p>
          <Button kind="primary" size="md" onClick={handleClose}>Fermer</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[#6B5A4A]">Classez <strong className="text-[#1A1410]">{candidate?.full_name}</strong> pour le retrouver facilement.</p>
          <div className="grid grid-cols-2 gap-2">
            {TALENT_POOL_CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className="p-2.5 rounded-xl border-2 text-sm font-semibold text-left transition-all"
                style={{ borderColor: category === c.id ? KZ.violet : KZ.line, background: category === c.id ? KZ.violetSoft : 'white' }}>
                {c.label}
              </button>
            ))}
          </div>
          <Textarea label="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Ex : à rappeler en septembre, profil rare en soudure…" />
          <Button kind="primary" size="lg" full loading={loading} icon={<Bookmark size={15} />} onClick={save}>
            Ajouter au vivier
          </Button>
        </div>
      )}
    </Modal>
  )
}

// Recommandation rapide dérivée du taux d'adéquation (déterministe, sans appel IA).
function recoFromScore(score: number): { label: string; bg: string; color: string } {
  if (score >= 80) return { label: 'À contacter',       bg: KZ.greenSoft,  color: KZ.green }
  if (score >= 60) return { label: 'Profil intéressant', bg: KZ.violetSoft, color: KZ.violet }
  if (score >= 40) return { label: 'À étudier',          bg: KZ.yellowSoft, color: '#B7791F' }
  return                  { label: 'Peu prioritaire',    bg: KZ.cream2,     color: KZ.mute }
}

// ── Modal synthèse IA d'une candidature ────────────────────────
function ApplicationSummaryModal({ app, onClose }: { app: Application | null; onClose: () => void }) {
  const { generating, summary, raw, error, locked, generate, reset } = useApplicationSummaryAI()
  const candidate = app?.candidate as { full_name?: string } | undefined

  // Génère dès l'ouverture
  if (app && !summary && !raw && !generating && !error && !locked) {
    generate(app.id)
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <Modal open={!!app} onClose={handleClose} title="Synthèse IA de la candidature" size="lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[#1A1410]" style={{ background: KZ.violetSoft }}>
          <Sparkles size={18} color={KZ.violet} />
          <p className="text-sm font-semibold text-[#1A1410]">
            {candidate?.full_name ? `Analyse de ${candidate.full_name}` : 'KazaIA analyse cette candidature'} — {app?.job?.title}
          </p>
        </div>

        {generating && (
          <div className="flex flex-col items-center gap-3 py-8">
            <InlineLoader size={48} />
            <p className="text-sm text-[#6B5A4A]">Lecture du profil et croisement avec l&apos;offre…</p>
          </div>
        )}

        {locked && (
          <div className="p-5 rounded-xl border border-[#1A1410] flex flex-col items-center gap-3 text-center" style={{ background: KZ.orangeSoft }}>
            <div className="w-12 h-12 rounded-full border border-[#1A1410] flex items-center justify-center" style={{ background: 'white' }}>
              <Lock size={20} color={KZ.orange} />
            </div>
            <p className="text-sm font-bold text-[#1A1410]">{locked}</p>
            <Link href="/recruiter/company"><Button kind="primary" size="md">Passer à un plan supérieur</Button></Link>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {summary && !generating && (
          <div className="flex flex-col gap-4">
            {/* Recommandation rapide (premium) */}
            {(() => {
              const r = recoFromScore(summary.adequation)
              return (
                <div className="p-4 rounded-xl border-2 border-[#1A1410] flex items-center gap-3"
                  style={{ background: r.bg, boxShadow: '3px 3px 0 #1A1410' }}>
                  <Sparkles size={20} color={r.color} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B5A4A]">Recommandation KazaIA</p>
                    <p className="text-lg font-extrabold text-[#1A1410]">{r.label}</p>
                  </div>
                  <span className="ml-auto text-2xl font-extrabold" style={{ color: r.color }}>{summary.adequation}%</span>
                </div>
              )
            })()}
            {/* Adéquation */}
            <div className="p-4 rounded-xl border border-[#1A1410]" style={{ background: KZ.violetSoft }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#1A1410]">Taux d&apos;adéquation</span>
                <span className="text-2xl font-extrabold" style={{ color: KZ.violet }}>{summary.adequation}%</span>
              </div>
              <Progress value={summary.adequation} color={KZ.violet} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#6B5A4A] mb-1">Résumé du profil</p>
              <p className="text-sm text-[#2A2018] leading-relaxed">{summary.resume}</p>
            </div>

            {summary.competences_match?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#6B5A4A] mb-1.5">Compétences correspondantes</p>
                <div className="flex gap-2 flex-wrap">{summary.competences_match.map((c, i) => <Tag key={i}>{c}</Tag>)}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {summary.points_forts?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#6B5A4A] mb-1.5">Points forts</p>
                  <ul className="flex flex-col gap-1.5">
                    {summary.points_forts.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#2A2018]"><Check size={14} className="mt-0.5 shrink-0" color={KZ.green} />{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.points_vigilance?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#6B5A4A] mb-1.5">Points de vigilance</p>
                  <ul className="flex flex-col gap-1.5">
                    {summary.points_vigilance.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#2A2018]"><AlertTriangle size={14} className="mt-0.5 shrink-0" color={KZ.orange} />{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {summary.experiences?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#6B5A4A] mb-1.5">Expériences pertinentes</p>
                <ul className="flex flex-col gap-1.5">
                  {summary.experiences.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#2A2018]">• {e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 rounded-xl border border-[#1A1410]" style={{ background: KZ.greenSoft }}>
              <p className="text-xs font-bold uppercase tracking-wide text-[#1A1410] mb-1">Recommandation</p>
              <p className="text-sm font-semibold text-[#2A2018]">{summary.decision}</p>
            </div>
            <p className="text-[11px] text-[#6B5A4A] italic">Généré par KazaIA — aide à la décision, ne remplace pas votre jugement.</p>
          </div>
        )}

        {raw && !summary && !generating && (
          <div className="p-4 rounded-xl border border-[#1A1410] text-sm text-[#2A2018] leading-relaxed whitespace-pre-wrap" style={{ background: KZ.paper }}>{raw}</div>
        )}

        <Button kind="outline" size="md" onClick={handleClose}>Fermer</Button>
      </div>
    </Modal>
  )
}
