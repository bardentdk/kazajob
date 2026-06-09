'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Clock, Users, Euro, Check, CalendarCheck, GraduationCap, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import { KZ, CERTIFICATION_LEVELS } from '@/lib/constants'
import type { TrainingOffer } from '@/lib/types'

const certLabel = (id: string) => CERTIFICATION_LEVELS.find(c => c.id === id)?.label ?? id

export default function TrainingDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { profile } = useAuth()

  const [offer, setOffer]           = useState<TrainingOffer | null>(null)
  const [loading, setLoading]       = useState(true)
  const [applyModal, setApplyModal] = useState(false)
  const [icModal, setIcModal]       = useState(false)
  const [motivation, setMotivation] = useState('')
  const [applying, setApplying]     = useState(false)
  const [applied, setApplied]       = useState(false)
  const [icRegistered, setIcReg]    = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/trainings/${id}`)
        if (res.ok) {
          const { offer: o, is_applied, is_ic_registered } = await res.json()
          setOffer(o as TrainingOffer)
          if (is_applied) setApplied(true)
          if (is_ic_registered) setIcReg(true)
        }
      } catch { /* noop */ }
      setLoading(false)
    }
    load()
  }, [id])

  const handleApply = async () => {
    if (!profile?.id) return
    setApplying(true); setError('')
    const res = await fetch(`/api/trainings/${id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivation }),
    })
    if (res.ok) { setApplied(true); setApplyModal(false) }
    else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Erreur inconnue')
    }
    setApplying(false)
  }

  const handleIcRegister = async () => {
    if (!profile?.id || !offer?.info_session_id) return
    setApplying(true)
    await fetch(`/api/events/${offer.info_session_id}/register`, { method: 'POST' })
    setIcReg(true); setIcModal(false); setApplying(false)
  }

  if (loading) return <PageLoader />
  if (!offer) return (
    <div className="text-center py-16">
      <p className="text-[#6B5A4A] mb-4">Formation introuvable.</p>
      <Button kind="outline" onClick={() => router.back()}>Retour</Button>
    </div>
  )

  const hasIC  = !!offer.info_session
  const icDate = hasIC ? new Date((offer.info_session as { date: string }).date) : null

  return (
    <div className="max-w-[900px] mx-auto">
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-semibold text-[#6B5A4A] hover:text-[#1A1410] mb-5">
        <ArrowLeft size={16} /> Retour aux formations
      </button>

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-5">
        {/* Main */}
        <div className="flex flex-col gap-4">
          {/* Image */}
          {offer.image_url && (
            <div className="kz-card overflow-hidden" style={{ height: 240 }}>
              <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Header */}
          <div className="kz-card p-5 bg-white">
            <div className="text-sm font-semibold text-[#6B5A4A] mb-1">{offer.company?.name ?? 'Organisme de formation'}</div>
            <h1 className="text-xl font-extrabold text-[#1A1410] mb-3">{offer.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {offer.certification_level && <Badge color="violet" size="md">{certLabel(offer.certification_level)}</Badge>}
              {offer.is_financed && <Badge color="green" size="md">Formation financée</Badge>}
              {offer.remote && <Badge color="blue" size="md">Distanciel</Badge>}
              {hasIC && <Badge color="green" size="md"><span className="flex items-center gap-1"><CalendarCheck size={11} /> Session IC disponible</span></Badge>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: <Clock size={14} />, label: 'Durée', val: `${offer.duration_value} ${offer.duration_unit}` },
                { icon: <MapPin size={14} />, label: 'Lieu', val: offer.location },
                { icon: <Users size={14} />, label: 'Places', val: `${offer.max_participants} max` },
                ...(offer.start_date ? [{ icon: <CalendarCheck size={14} />, label: 'Début', val: new Date(offer.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }] : []),
                ...(offer.financing_options.length > 0 ? [{ icon: <Euro size={14} />, label: 'Financement', val: offer.financing_options.join(', ') }] : []),
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                  <div className="flex items-center gap-1.5 text-[#6B5A4A] mb-0.5">{item.icon}<span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span></div>
                  <div className="text-xs font-bold text-[#1A1410]">{item.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="kz-card p-5 bg-white">
            <h2 className="text-base font-bold text-[#1A1410] mb-3">À propos de la formation</h2>
            <p className="text-sm leading-relaxed text-[#2A2018] whitespace-pre-line">{offer.description}</p>
          </div>

          {/* Programme */}
          {offer.program && (
            <div className="kz-card p-5 bg-white">
              <h2 className="text-base font-bold text-[#1A1410] mb-3">Programme pédagogique</h2>
              <p className="text-sm leading-relaxed text-[#2A2018] whitespace-pre-line">{offer.program}</p>
            </div>
          )}

          {/* Prérequis */}
          {offer.prerequisites && (
            <div className="kz-card p-5 bg-white">
              <h2 className="text-base font-bold text-[#1A1410] mb-3">Prérequis d&apos;accès</h2>
              <p className="text-sm leading-relaxed text-[#2A2018] whitespace-pre-line">{offer.prerequisites}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* CTA principal */}
          <div className="kz-card p-5 bg-white">
            {offer.certification && (
              <div className="text-base font-extrabold text-[#1A1410] mb-1">{offer.certification}</div>
            )}
            <div className="text-sm text-[#6B5A4A] mb-4">{offer.duration_value} {offer.duration_unit} · {offer.location}</div>

            {applied ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-[#19A974] bg-[#D6F0E0]">
                <Check size={16} color={KZ.green} />
                <span className="text-sm font-bold text-[#1A1410]">Dossier envoyé !</span>
              </div>
            ) : (
              <Button kind="primary" size="lg" full onClick={() => setApplyModal(true)}>
                <span className="flex items-center gap-2"><GraduationCap size={15} /> Postuler à la formation</span>
              </Button>
            )}
          </div>

          {/* Session IC */}
          {hasIC && icDate && (
            <div className="kz-card p-5 bg-white border-[#19A974]" style={{ borderColor: KZ.green }}>
              <div className="flex items-center gap-2 mb-3">
                <CalendarCheck size={16} color={KZ.green} />
                <h3 className="text-sm font-bold text-[#1A1410]">Session d&apos;Information Collective</h3>
              </div>
              <div className="text-xs text-[#6B5A4A] mb-1">
                {(offer.info_session as { title: string }).title}
              </div>
              <div className="text-xs font-bold text-[#1A1410] mb-3">
                {icDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' à '}{icDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {icRegistered ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[#19A974] bg-[#D6F0E0]">
                  <Check size={14} color={KZ.green} />
                  <span className="text-xs font-bold text-[#1A1410]">Inscrit à la session IC</span>
                </div>
              ) : (
                <Button kind="outline" size="sm" full onClick={() => setIcModal(true)}>
                  S&apos;inscrire à la session IC
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal candidature */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Postuler à cette formation">
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-[#1A1410]">{offer.title}</h3>
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <Textarea
            label="Lettre de motivation (optionnel)"
            value={motivation}
            onChange={e => setMotivation(e.target.value)}
            placeholder="Pourquoi souhaitez-vous suivre cette formation ? Votre projet professionnel..."
            rows={5}
          />
          <div className="flex gap-2.5">
            <Button kind="outline" size="lg" full onClick={() => setApplyModal(false)}>Annuler</Button>
            <Button kind="primary" size="lg" full loading={applying} onClick={handleApply}>
              Envoyer mon dossier
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal IC */}
      <Modal open={icModal} onClose={() => setIcModal(false)} title="Session d'Information Collective">
        <div className="flex flex-col gap-4">
          {hasIC && icDate && (
            <>
              <div className="p-4 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.greenSoft }}>
                <div className="text-sm font-bold text-[#1A1410] mb-1">{(offer.info_session as { title: string }).title}</div>
                <div className="text-xs text-[#6B5A4A]">
                  {icDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' à '}{icDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <p className="text-sm text-[#2A2018]">
                Cette session vous permettra de découvrir la formation en détail, poser vos questions et rencontrer l&apos;équipe pédagogique.
              </p>
              <div className="flex gap-2.5">
                <Button kind="outline" size="lg" full onClick={() => setIcModal(false)}>Annuler</Button>
                <Button kind="primary" size="lg" full loading={applying} onClick={handleIcRegister}
                  icon={<CalendarCheck size={15} />}>
                  S&apos;inscrire
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
