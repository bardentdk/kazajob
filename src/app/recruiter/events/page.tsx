'use client'

import { useEffect, useState } from 'react'
import { Plus, Calendar, Users, Trash2, ExternalLink, Star, UserCheck, Monitor, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useAuth } from '@/features/auth/useAuth'
import { createClient } from '@/lib/supabase/client'
import { KZ, EVENT_TYPES } from '@/lib/constants'
import type { BadgeColor } from '@/lib/types'

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
  is_published: boolean
  registrations_count: number
}

const TYPE_COLORS: Record<string, BadgeColor> = {
  job_dating: 'violet',
  webinar:    'blue',
  atelier:    'orange',
}
const TYPE_ICONS: Record<string, React.ReactNode> = {
  job_dating: <UserCheck size={14} />,
  webinar:    <Monitor   size={14} />,
  atelier:    <BookOpen  size={14} />,
}

export default function RecruiterEventsPage() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [events, setEvents] = useState<KazaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Formulaire
  const [form, setForm] = useState({
    title: '', type: 'job_dating', date: '', duration_minutes: '60',
    max_participants: '30', location: 'En ligne', description: '',
  })

  const fetchEvents = async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('events')
      .select('*, registrations:event_registrations(count)')
      .eq('organizer_id', profile.id)
      .order('date', { ascending: false })

    setEvents(
      (data ?? []).map((e: KazaEvent & { registrations: { count: number }[] }) => ({
        ...e,
        registrations_count: e.registrations?.[0]?.count ?? 0,
      }))
    )
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [profile?.id])

  const handleCreate = async () => {
    if (!profile?.id || !form.title || !form.date) return
    setSaving(true)
    const jitsiRoom = `kaza-event-${Date.now().toString(36)}`
    const { error } = await supabase.from('events').insert({
      organizer_id: profile.id,
      title: form.title,
      type: form.type,
      date: new Date(form.date).toISOString(),
      duration_minutes: parseInt(form.duration_minutes),
      max_participants: parseInt(form.max_participants),
      location: form.location,
      description: form.description || null,
      jitsi_room: jitsiRoom,
      is_published: true,
    })
    if (!error) {
      setModal(false)
      setForm({ title: '', type: 'job_dating', date: '', duration_minutes: '60', max_participants: '30', location: 'En ligne', description: '' })
      await fetchEvents()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet événement ? Les inscriptions seront annulées.')) return
    setDeletingId(id)
    await supabase.from('events').delete().eq('id', id)
    await fetchEvents()
    setDeletingId(null)
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Événements</p>
          <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight text-[#1A1410]">KazaEvents</h1>
        </div>
        <Button kind="primary" size="md" icon={<Plus size={15} />} onClick={() => setModal(true)}>
          Créer un événement
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => <div key={i} className="h-28 rounded-2xl bg-[#FBEFE0] animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="Aucun événement créé"
          description="Organisez un job dating, un webinaire ou un atelier pour rencontrer vos candidats."
          icon={<Star size={28} />}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {events.map(evt => {
            const typeInfo = EVENT_TYPES[evt.type] ?? { label: evt.type, emoji: '📅', color: KZ.mute, bg: KZ.cream2 }
            const eventDate = new Date(evt.date)
            const isPast = eventDate < new Date()

            return (
              <div key={evt.id} className="kz-card p-5 bg-white flex items-start gap-4">
                {/* Date */}
                <div
                  className="w-14 h-14 rounded-xl border border-[#1A1410] flex flex-col items-center justify-center shrink-0"
                  style={{ background: typeInfo.bg, opacity: isPast ? 0.6 : 1 }}
                >
                  <div className="text-lg font-extrabold text-[#1A1410] leading-none">{eventDate.getDate()}</div>
                  <div className="text-[10px] font-bold uppercase text-[#6B5A4A]">
                    {eventDate.toLocaleDateString('fr-FR', { month: 'short' })}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge color={TYPE_COLORS[evt.type] ?? 'cream'} size="sm">
                      <span className="flex items-center gap-1">{TYPE_ICONS[evt.type]}{typeInfo.label}</span>
                    </Badge>
                    {isPast && <Badge color="cream" size="sm">Terminé</Badge>}
                    {!evt.is_published && <Badge color="orange" size="sm">Brouillon</Badge>}
                  </div>
                  <h3 className="text-sm font-bold text-[#1A1410] truncate">{evt.title}</h3>
                  <div className="text-xs text-[#6B5A4A] mt-1 flex gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      {' '}à {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {evt.registrations_count} / {evt.max_participants} inscrits
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {evt.jitsi_room && (
                    <a href={`https://meet.jit.si/${evt.jitsi_room}`} target="_blank" rel="noreferrer">
                      <button className="p-2 rounded-lg border border-[#E8DDC9] hover:border-[#1A1410] transition-colors" title="Rejoindre la salle">
                        <ExternalLink size={14} />
                      </button>
                    </a>
                  )}
                  <button
                    className="p-2 rounded-lg border border-[#E8DDC9] hover:border-red-400 hover:text-red-500 transition-colors"
                    title="Supprimer"
                    onClick={() => handleDelete(evt.id)}
                    disabled={deletingId === evt.id}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal création */}
      <Modal open={modal} onClose={() => setModal(false)} title="Créer un événement">
        <div className="flex flex-col gap-4">
          <Input
            label="Titre de l'événement *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Job Dating Tech · Réunion"
          />

          <div>
            <label className="block text-sm font-semibold text-[#1A1410] mb-1.5">Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(EVENT_TYPES).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: key }))}
                  className="p-2.5 rounded-xl border-2 text-center text-xs font-bold transition-all"
                  style={{
                    background: form.type === key ? val.bg : KZ.cream2,
                    borderColor: form.type === key ? val.color : KZ.line,
                    color: form.type === key ? val.color : KZ.mute,
                  }}
                >
                  <div className="flex justify-center mb-0.5">{TYPE_ICONS[key]}</div>
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date et heure *"
              type="datetime-local"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-semibold text-[#1A1410] mb-1.5">Durée</label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border-2 border-[#1A1410] text-sm bg-white focus:outline-none focus:border-[#6D3BEB]"
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
              >
                {[30, 45, 60, 90, 120].map(d => (
                  <option key={d} value={d}>{d < 60 ? `${d} min` : `${d / 60}h`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Lieu / Plateforme"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="En ligne (Jitsi)"
            />
            <Input
              label="Places max"
              type="number"
              value={form.max_participants}
              onChange={e => setForm(f => ({ ...f, max_participants: e.target.value }))}
              min="1"
              max="500"
            />
          </div>

          <Textarea
            label="Description (optionnel)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Présentez votre événement, les thèmes abordés, le profil recherché..."
            rows={3}
          />

          <div
            className="p-3 rounded-xl border border-[#1A1410] text-xs text-[#2A2018]"
            style={{ background: KZ.violetSoft }}
          >
            💡 Un lien Jitsi Meet sera automatiquement généré et partagé avec les inscrits le jour J.
          </div>

          <div className="flex gap-2.5">
            <Button kind="outline" size="lg" full onClick={() => setModal(false)}>Annuler</Button>
            <Button kind="primary" size="lg" full loading={saving} onClick={handleCreate}
              disabled={!form.title || !form.date}>
              Créer l&apos;événement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
