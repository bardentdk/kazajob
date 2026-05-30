'use client'

import { useEffect, useState } from 'react'
import { Calendar, MapPin, Users, Clock, ExternalLink, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useAuth } from '@/features/auth/useAuth'
import { createClient } from '@/lib/supabase/client'
import { KZ, EVENT_TYPES } from '@/lib/constants'

interface KazaEvent {
  id: string
  title: string
  description: string | null
  type: string
  date: string
  duration_minutes: number
  max_participants: number
  location: string
  jitsi_room: string | null
  registrations_count: number
  is_registered: boolean
}

export default function CandidateEventsPage() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [events, setEvents] = useState<KazaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState<string | null>(null)

  const fetchEvents = async () => {
    if (!profile?.id) return
    const { data: evts } = await supabase
      .from('events')
      .select('*, registrations:event_registrations(count)')
      .eq('is_published', true)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })

    if (!evts) { setLoading(false); return }

    // Vérifier les inscriptions du candidat
    const { data: myRegs } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('candidate_id', profile.id)

    const myEventIds = new Set((myRegs ?? []).map((r: { event_id: string }) => r.event_id))

    setEvents(evts.map((e: KazaEvent & { registrations: {count: number}[] }) => ({
      ...e,
      registrations_count: e.registrations?.[0]?.count ?? 0,
      is_registered: myEventIds.has(e.id),
    })))
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [profile?.id])

  const handleRegister = async (eventId: string, isReg: boolean) => {
    if (!profile?.id) return
    setRegistering(eventId)
    if (isReg) {
      await supabase.from('event_registrations')
        .delete().eq('event_id', eventId).eq('candidate_id', profile.id)
    } else {
      await supabase.from('event_registrations')
        .insert({ event_id: eventId, candidate_id: profile.id })
    }
    await fetchEvents()
    setRegistering(null)
  }

  const isEventLive = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    return d <= now && new Date(d.getTime() + 120 * 60_000) > now
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-6">
        <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Événements</p>
        <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">
          KazaEvents <span style={{ color: KZ.violet }}>974</span>
        </h1>
        <p className="text-sm text-[#6B5A4A] mt-1">
          Job dating en ligne, webinaires, ateliers — rencontrez les recruteurs de La Réunion.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl border border-[#E8DDC9] bg-[#FBEFE0] animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="Aucun événement à venir"
          description="Les prochains KazaEvents seront publiés bientôt. Revenez vite !"
          icon={<Star size={28} />}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {events.map(evt => {
            const typeInfo = EVENT_TYPES[evt.type] ?? { label: evt.type, emoji: '📅', color: KZ.mute, bg: KZ.cream2 }
            const eventDate = new Date(evt.date)
            const isFull = evt.registrations_count >= evt.max_participants && !evt.is_registered
            const live = isEventLive(evt.date)
            const spotsLeft = evt.max_participants - evt.registrations_count

            return (
              <div
                key={evt.id}
                className="kz-card p-5 bg-white flex flex-col sm:flex-row gap-4"
                style={live ? { borderColor: KZ.green, boxShadow: `0 0 0 2px ${KZ.green}30` } : {}}
              >
                {/* Date bloc */}
                <div
                  className="w-16 h-16 rounded-xl border border-[#1A1410] flex flex-col items-center justify-center shrink-0 self-start"
                  style={{ background: typeInfo.bg }}
                >
                  <div className="text-xl font-extrabold text-[#1A1410] leading-none">
                    {eventDate.getDate()}
                  </div>
                  <div className="text-[10px] font-bold uppercase text-[#6B5A4A]">
                    {eventDate.toLocaleDateString('fr-FR', { month: 'short' })}
                  </div>
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-2">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#1A1410]"
                      style={{ background: typeInfo.bg, color: typeInfo.color }}
                    >
                      {typeInfo.emoji} {typeInfo.label}
                    </span>
                    {live && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#19A974] bg-[#D6F0E0] text-[#19A974] animate-pulse">
                        🔴 En direct
                      </span>
                    )}
                    {evt.is_registered && !live && (
                      <Badge color="green" size="sm">Inscrit ✓</Badge>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#1A1410] mb-1">{evt.title}</h3>
                  {evt.description && (
                    <p className="text-sm text-[#6B5A4A] mb-2 line-clamp-2">{evt.description}</p>
                  )}

                  <div className="flex gap-4 flex-wrap text-xs text-[#6B5A4A]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {' '}· {evt.duration_minutes}min
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {evt.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {isFull ? (
                        <span className="text-[#FF6B35] font-semibold">Complet</span>
                      ) : (
                        <span><strong>{spotsLeft}</strong> places restantes</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0 sm:items-end justify-start">
                  {live && evt.is_registered && evt.jitsi_room ? (
                    <a
                      href={`https://meet.jit.si/${evt.jitsi_room}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button kind="primary" size="sm" icon={<ExternalLink size={13} />}>
                        Rejoindre
                      </Button>
                    </a>
                  ) : (
                    <Button
                      kind={evt.is_registered ? 'soft' : isFull ? 'outline' : 'primary'}
                      size="sm"
                      loading={registering === evt.id}
                      disabled={isFull && !evt.is_registered}
                      onClick={() => handleRegister(evt.id, evt.is_registered)}
                    >
                      {evt.is_registered ? "Se désinscrire" : isFull ? "Complet" : "S'inscrire"}
                    </Button>
                  )}
                  {evt.is_registered && !live && (
                    <p className="text-[11px] text-[#6B5A4A] text-right">
                      Lien disponible le jour J
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
