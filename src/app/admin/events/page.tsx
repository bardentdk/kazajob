'use client'

import { useEffect, useState } from 'react'
import { Star, Trash2, ExternalLink, Users, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { KZ, EVENT_TYPES } from '@/lib/constants'
import type { BadgeColor } from '@/lib/types'

interface AdminEvent {
  id: string
  title: string
  type: string
  date: string
  location: string
  max_participants: number
  jitsi_room: string | null
  is_published: boolean
  organizer: { full_name: string; email: string } | null
  registrations_count: number
}

const TYPE_BADGE: Record<string, BadgeColor> = { job_dating: 'violet', webinar: 'blue', atelier: 'orange' }

export default function AdminEventsPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*, organizer:profiles!organizer_id(full_name, email), registrations:event_registrations(count)')
      .order('date', { ascending: false })

    setEvents(
      (data ?? []).map((e: AdminEvent & { registrations: { count: number }[] }) => ({
        ...e,
        registrations_count: e.registrations?.[0]?.count ?? 0,
      }))
    )
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('events').update({ is_published: !current }).eq('id', id)
    await fetchEvents()
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Supprimer définitivement cet événement ?')) return
    setDeletingId(id)
    await supabase.from('events').delete().eq('id', id)
    await fetchEvents()
    setDeletingId(null)
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1A1410]">KazaEvents</h1>
        <p className="text-sm text-[#6B5A4A] mt-1">Tous les événements publiés par les recruteurs</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-[#FBEFE0] animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <EmptyState title="Aucun événement" icon={<Star size={24} />} />
      ) : (
        <div className="kz-card bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                <th className="text-left p-3 font-bold text-[#1A1410]">Événement</th>
                <th className="text-left p-3 font-bold text-[#1A1410] hidden md:table-cell">Organisateur</th>
                <th className="text-left p-3 font-bold text-[#1A1410] hidden sm:table-cell">Date</th>
                <th className="text-center p-3 font-bold text-[#1A1410]">Inscrits</th>
                <th className="text-center p-3 font-bold text-[#1A1410]">Statut</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {events.map(evt => {
                const typeInfo = EVENT_TYPES[evt.type] ?? { label: evt.type, emoji: '📅' }
                const isPast = new Date(evt.date) < new Date()
                return (
                  <tr key={evt.id} className="border-b border-[#E8DDC9] last:border-0 hover:bg-[#FBEFE0] transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge color={TYPE_BADGE[evt.type] ?? 'cream'} size="sm">
                          {typeInfo.emoji} {typeInfo.label}
                        </Badge>
                        <span className="font-semibold text-[#1A1410] truncate max-w-[180px]">{evt.title}</span>
                      </div>
                    </td>
                    <td className="p-3 text-[#6B5A4A] hidden md:table-cell">
                      <div>{evt.organizer?.full_name ?? '—'}</div>
                      <div className="text-[11px]">{evt.organizer?.email ?? ''}</div>
                    </td>
                    <td className="p-3 text-[#6B5A4A] hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(evt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                      {isPast && <span className="text-[11px] text-[#6B5A4A]">Terminé</span>}
                    </td>
                    <td className="p-3 text-center">
                      <span className="flex items-center justify-center gap-1 text-xs font-bold text-[#1A1410]">
                        <Users size={12} />{evt.registrations_count}/{evt.max_participants}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => togglePublish(evt.id, evt.is_published)}
                        className="text-[11px] font-bold px-2 py-1 rounded-full border border-[#1A1410] transition-colors"
                        style={{
                          background: evt.is_published ? KZ.greenSoft : KZ.cream2,
                          color: evt.is_published ? KZ.green : KZ.mute,
                        }}
                      >
                        {evt.is_published ? 'Publié' : 'Masqué'}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        {evt.jitsi_room && (
                          <a href={`https://meet.jit.si/${evt.jitsi_room}`} target="_blank" rel="noreferrer"
                            className="p-1.5 rounded-lg border border-[#E8DDC9] hover:border-[#1A1410] transition-colors">
                            <ExternalLink size={13} />
                          </a>
                        )}
                        <button
                          onClick={() => deleteEvent(evt.id)}
                          disabled={deletingId === evt.id}
                          className="p-1.5 rounded-lg border border-[#E8DDC9] hover:border-red-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
