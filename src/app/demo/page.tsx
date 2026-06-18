'use client'

import { useEffect, useState } from 'react'
import { CalendarCheck, Check, Clock, Sparkles, Users, BarChart2 } from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { KZ } from '@/lib/constants'

interface Slot { id: string; starts_at: string; duration_min: number }

const ATOUTS = [
  { icon: <Sparkles size={18} />, t: 'Matching IA &amp; tri automatique', d: 'Les meilleurs profils 974 remontés en priorité.' },
  { icon: <Users size={18} />, t: 'Vivier &amp; multidiffusion', d: 'Centralisez vos candidatures et votre équipe.' },
  { icon: <BarChart2 size={18} />, t: 'Analytics &amp; KazaScore', d: 'Pilotez vos recrutements en temps réel.' },
]

export default function DemoPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotId, setSlotId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/demo/slots').then((r) => (r.ok ? r.json() : [])).then((d) => setSlots(d as Slot[])).catch(() => {})
  }, [])

  const byDay: Record<string, Slot[]> = {}
  for (const s of slots) {
    const day = new Date(s.starts_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    ;(byDay[day] ??= []).push(s)
  }

  const submit = async () => {
    setError('')
    if (!form.name.trim() || !form.email.trim()) { setError('Nom et email sont obligatoires.'); return }
    setLoading(true)
    const res = await fetch('/api/demo/book', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slotId }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Une erreur est survenue.'); return }
    setDone(true)
  }

  return (
    <PublicShell>
      <section className="px-4 sm:px-8 lg:px-16 py-12" style={{ background: KZ.ink }}>
        <div className="max-w-[900px] mx-auto">
          <Badge color="violet" size="lg" className="mb-4">Démo gratuite · Recruteurs 974</Badge>
          <h1 className="text-3xl sm:text-[44px] font-extrabold tracking-[-0.03em] leading-[0.95] mb-4" style={{ color: KZ.cream }}>
            Découvrez Kazajob<br /><span style={{ color: KZ.orange }}>en 30 minutes.</span>
          </h1>
          <p className="text-base max-w-[560px]" style={{ color: 'rgba(255,247,238,0.75)' }}>
            Réservez un créneau avec notre équipe : on vous présente la plateforme et comment recruter plus vite à La Réunion.
          </p>
        </div>
      </section>

      <div className="max-w-[900px] mx-auto px-4 sm:px-8 lg:px-16 py-10">
        {done ? (
          <div className="kz-card p-10 bg-white text-center" style={{ boxShadow: '5px 5px 0 ' + KZ.violet }}>
            <div className="w-16 h-16 rounded-full border-2 border-[#1A1410] flex items-center justify-center mx-auto mb-4" style={{ background: KZ.greenSoft }}>
              <Check size={30} color={KZ.green} />
            </div>
            <h2 className="text-xl font-extrabold text-[#1A1410] mb-2">Demande envoyée !</h2>
            <p className="text-sm text-[#6B5A4A]">Vous allez recevoir un email de confirmation. À très vite !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            {/* Formulaire */}
            <div className="kz-card p-6 bg-white">
              <h2 className="text-lg font-extrabold text-[#1A1410] mb-4">Vos coordonnées</h2>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Nom complet *" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Marie Hoarau" />
                  <Input label="Entreprise" value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Ma Société" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="marie@email.re" />
                  <Input label="Téléphone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+262 ..." />
                </div>
                <Textarea label="Votre besoin (optionnel)" value={form.message} rows={3} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Ex : je recrute 3 commerciaux..." />

                {/* Créneaux */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1410] mb-1.5">Choisir un créneau</label>
                  {slots.length === 0 ? (
                    <p className="text-xs text-[#6B5A4A] p-3 rounded-lg border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                      Aucun créneau ouvert pour l&apos;instant — envoyez votre demande, nous vous recontactons pour fixer un rendez-vous.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-[260px] overflow-y-auto pr-1">
                      {Object.entries(byDay).map(([day, list]) => (
                        <div key={day}>
                          <div className="text-xs font-bold text-[#6B5A4A] capitalize mb-1.5">{day}</div>
                          <div className="flex flex-wrap gap-2">
                            {list.map((s) => {
                              const time = new Date(s.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                              const sel = slotId === s.id
                              return (
                                <button key={s.id} type="button" onClick={() => setSlotId(sel ? null : s.id)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all"
                                  style={{ borderColor: sel ? KZ.violet : KZ.line, background: sel ? KZ.violetSoft : 'white', color: KZ.ink }}>
                                  <Clock size={12} />{time}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
                <Button kind="primary" size="lg" full loading={loading} icon={<CalendarCheck size={16} />} onClick={submit}>
                  {slotId ? 'Confirmer mon rendez-vous' : 'Envoyer ma demande'}
                </Button>
              </div>
            </div>

            {/* Atouts */}
            <div className="flex flex-col gap-3">
              {ATOUTS.map((a) => (
                <div key={a.t} className="kz-card p-4 bg-white flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-lg border border-[#1A1410] flex items-center justify-center shrink-0" style={{ background: KZ.violetSoft, color: KZ.violet }}>{a.icon}</div>
                  <div>
                    <div className="text-sm font-bold text-[#1A1410]" dangerouslySetInnerHTML={{ __html: a.t }} />
                    <div className="text-xs text-[#6B5A4A]" dangerouslySetInnerHTML={{ __html: a.d }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PublicShell>
  )
}
