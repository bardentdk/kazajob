'use client'

import { useEffect, useState } from 'react'
import { CalendarPlus, Trash2, Clock, Mail, Phone, Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import type { BadgeColor } from '@/lib/types'
import { KZ } from '@/lib/constants'

interface Slot { id: string; starts_at: string; duration_min: number; is_booked: boolean }
interface Booking { id: string; name: string; company: string | null; email: string; phone: string | null; message: string | null; status: string; created_at: string; when: string | null }

const ST: Record<string, { label: string; color: BadgeColor }> = {
  confirmed: { label: 'Confirmé', color: 'green' },
  cancelled: { label: 'Annulé', color: 'orange' },
  done:      { label: 'Terminé', color: 'violet' },
}

export default function AdminDemoPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [newSlot, setNewSlot] = useState('')
  const [dur, setDur] = useState('30')

  const load = async () => {
    try {
      const [s, b] = await Promise.all([fetch('/api/admin/demo/slots'), fetch('/api/admin/demo/bookings')])
      if (s.ok) setSlots(await s.json())
      if (b.ok) setBookings(await b.json())
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const addSlot = async () => {
    if (!newSlot) return
    await fetch('/api/admin/demo/slots', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starts: [new Date(newSlot).toISOString()], durationMin: parseInt(dur) }),
    })
    setNewSlot('')
    load()
  }

  const delSlot = async (id: string) => {
    await fetch(`/api/admin/demo/slots/${id}`, { method: 'DELETE' })
    load()
  }

  const setStatus = async (id: string, status: string) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b))
    await fetch(`/api/admin/demo/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    load()
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-6">
        <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Commercial</p>
        <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">Démos &amp; rendez-vous</h1>
        <p className="text-sm text-[#6B5A4A] mt-1">Lien public à mettre dans vos mailings : <code>/demo</code></p>
      </div>

      {/* Créneaux */}
      <div className="kz-card p-5 bg-white mb-6">
        <h2 className="text-base font-bold text-[#1A1410] mb-3 flex items-center gap-2"><CalendarPlus size={16} />Ouvrir un créneau</h2>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input className="flex-1" type="datetime-local" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} />
          <Select className="sm:w-36" options={[{ value: '15', label: '15 min' }, { value: '30', label: '30 min' }, { value: '45', label: '45 min' }, { value: '60', label: '1 heure' }]} value={dur} onChange={(e) => setDur(e.target.value)} />
          <Button kind="primary" size="md" icon={<Plus size={15} />} onClick={addSlot}>Ajouter</Button>
        </div>
        {slots.length === 0 ? (
          <p className="text-xs text-[#6B5A4A]">Aucun créneau ouvert. Ajoutez-en pour permettre la réservation en ligne.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1A1410] text-xs font-semibold"
                style={{ background: s.is_booked ? KZ.orangeSoft : KZ.greenSoft }}>
                <Clock size={11} />{fmt(s.starts_at)} · {s.duration_min}min
                {s.is_booked && <Badge color="orange" size="sm">Réservé</Badge>}
                {!s.is_booked && <button onClick={() => delSlot(s.id)} className="text-[#6B5A4A] hover:text-red-600"><Trash2 size={12} /></button>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RDV */}
      <h2 className="text-base font-bold text-[#1A1410] mb-3">Demandes de RDV ({bookings.length})</h2>
      {loading ? <PageLoader /> : bookings.length === 0 ? (
        <EmptyState title="Aucune demande" description="Les demandes de démo arriveront ici, depuis la page publique /demo." icon={<CalendarPlus size={28} />} />
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((b) => (
            <div key={b.id} className="kz-card p-4 bg-white">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-bold text-[#1A1410]">{b.name}</span>
                    {b.company && <span className="text-xs text-[#6B5A4A] flex items-center gap-1"><Building2 size={11} />{b.company}</span>}
                    <Badge color={ST[b.status]?.color ?? 'cream'} size="sm">{ST[b.status]?.label ?? b.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-[#6B5A4A]">
                    <a href={`mailto:${b.email}`} className="flex items-center gap-1 hover:underline"><Mail size={11} />{b.email}</a>
                    {b.phone && <a href={`tel:${b.phone}`} className="flex items-center gap-1 hover:underline"><Phone size={11} />{b.phone}</a>}
                    <span className="flex items-center gap-1 font-semibold" style={{ color: KZ.violet }}><Clock size={11} />{b.when ? fmt(b.when) : 'À convenir'}</span>
                  </div>
                  {b.message && <p className="text-xs text-[#6B5A4A] mt-1 italic">« {b.message} »</p>}
                </div>
                <select value={b.status} onChange={(e) => setStatus(b.id, e.target.value)}
                  className="text-xs font-semibold h-8 px-2 border border-[#1A1410] rounded-lg bg-white cursor-pointer shrink-0">
                  <option value="confirmed">Confirmé</option>
                  <option value="cancelled">Annulé</option>
                  <option value="done">Terminé</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
