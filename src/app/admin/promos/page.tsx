'use client'

import { useEffect, useState } from 'react'
import { Ticket, Trash2, Power, CalendarClock, Zap, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { KZ } from '@/lib/constants'

interface Promo {
  id: string; code: string; description: string | null
  discountType: 'percent' | 'amount'; discountValue: number
  durationType: 'once' | 'repeating' | 'forever'; durationMonths: number | null
  startDate: string | null; endDate: string | null; maxRedemptions: number | null; usedCount: number
  active: boolean; stripeCouponId: string | null; createdAt: string
}

const DUR = { once: '1er paiement', repeating: 'X mois', forever: 'À vie' }

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'percent', discountValue: '',
    durationType: 'once', durationMonths: '3', durationDays: '30', customDates: false,
    startDate: '', endDate: '', maxRedemptions: '',
  })

  const load = async () => {
    try { const r = await fetch('/api/admin/promos'); if (r.ok) setPromos(await r.json()) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    setError('')
    if (!form.code.trim() || !form.discountValue) { setError('Code et valeur requis.'); return }
    // Validité : par défaut durée en jours depuis aujourd'hui → date de fin calculée.
    let startDate: string | null = null
    let endDate: string | null = null
    if (form.customDates) {
      startDate = form.startDate ? new Date(form.startDate + 'T00:00:00').toISOString() : null
      endDate = form.endDate ? new Date(form.endDate + 'T23:59:59').toISOString() : null
    } else if (form.durationDays && parseInt(form.durationDays) > 0) {
      const d = new Date(); d.setDate(d.getDate() + parseInt(form.durationDays)); d.setHours(23, 59, 59, 0)
      endDate = d.toISOString()
    }
    setCreating(true)
    const res = await fetch('/api/admin/promos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code, description: form.description || null,
        discountType: form.discountType,
        discountValue: form.discountType === 'amount' ? Math.round(parseFloat(form.discountValue) * 100) : parseInt(form.discountValue),
        durationType: form.durationType,
        durationMonths: form.durationType === 'repeating' ? parseInt(form.durationMonths) : null,
        startDate, endDate,
        maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : null,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setCreating(false)
    if (!res.ok) { setError(data.error ?? 'Erreur'); return }
    setForm({ code: '', description: '', discountType: 'percent', discountValue: '', durationType: 'once', durationMonths: '3', durationDays: '30', customDates: false, startDate: '', endDate: '', maxRedemptions: '' })
    load()
  }

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/promos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await res.json().catch(() => ({}))
    if (body.applyActive && res.ok) alert(`Coupon appliqué à ${d.applied ?? 0} abonnement(s) actif(s).`)
    load()
  }

  const extend = (p: Promo) => {
    const cur = p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : ''
    const v = prompt('Nouvelle date de fin (AAAA-MM-JJ) — vide = illimité :', cur)
    if (v === null) return
    patch(p.id, { endDate: v ? new Date(v + 'T23:59:59').toISOString() : null })
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce code promo (et son coupon Stripe) ?')) return
    await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' })
    load()
  }

  const statusOf = (p: Promo) => {
    if (!p.active) return { label: 'Désactivé', color: 'cream' as const }
    if (p.endDate && new Date(p.endDate) < new Date()) return { label: 'Expiré', color: 'orange' as const }
    if (p.maxRedemptions !== null && p.usedCount >= p.maxRedemptions) return { label: 'Épuisé', color: 'orange' as const }
    return { label: 'Actif', color: 'green' as const }
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-6">
        <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Marketing</p>
        <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">Codes promo</h1>
        <p className="text-sm text-[#6B5A4A] mt-1">Réductions sur les abonnements recruteur, synchronisées avec Stripe.</p>
      </div>

      {/* Création */}
      <div className="kz-card p-5 bg-white mb-6">
        <h2 className="text-base font-bold text-[#1A1410] mb-3 flex items-center gap-2"><Plus size={16} />Nouveau code</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input label="Code *" value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="RENTREE25" icon={<Ticket size={15} />} />
          <Select label="Type" options={[{ value: 'percent', label: 'Pourcentage (%)' }, { value: 'amount', label: 'Montant (€)' }]} value={form.discountType} onChange={(e) => setForm(f => ({ ...f, discountType: e.target.value }))} />
          <Input label={form.discountType === 'percent' ? 'Réduction (%)' : 'Réduction (€)'} type="number" value={form.discountValue} onChange={(e) => setForm(f => ({ ...f, discountValue: e.target.value }))} placeholder={form.discountType === 'percent' ? '25' : '20'} />
          <Select label="Durée de la remise" options={[{ value: 'once', label: '1er paiement' }, { value: 'repeating', label: 'Plusieurs mois' }, { value: 'forever', label: 'À vie' }]} value={form.durationType} onChange={(e) => setForm(f => ({ ...f, durationType: e.target.value }))} />
          {form.durationType === 'repeating' && (
            <Input label="Nombre de mois" type="number" value={form.durationMonths} onChange={(e) => setForm(f => ({ ...f, durationMonths: e.target.value }))} />
          )}
          {!form.customDates ? (
            <Input label="Validité (jours à partir d'aujourd'hui)" type="number" value={form.durationDays}
              onChange={(e) => setForm(f => ({ ...f, durationDays: e.target.value }))} placeholder="30" />
          ) : (
            <>
              <Input label="Début" type="date" value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))} />
              <Input label="Fin" type="date" value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </>
          )}
          <label className="flex items-center gap-2 self-end pb-2.5 cursor-pointer text-sm font-semibold text-[#1A1410]">
            <input type="checkbox" checked={form.customDates} onChange={(e) => setForm(f => ({ ...f, customDates: e.target.checked }))} className="w-4 h-4 accent-[#6D3BEB]" />
            Définir des dates précises
          </label>
          <Input label="Max utilisations" type="number" value={form.maxRedemptions} onChange={(e) => setForm(f => ({ ...f, maxRedemptions: e.target.value }))} placeholder="illimité" />
          <Input label="Description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Promo de rentrée" />
        </div>
        {error && <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
        <Button kind="primary" size="md" className="mt-3" loading={creating} icon={<Plus size={15} />} onClick={create}>Créer le code</Button>
      </div>

      {/* Liste */}
      {loading ? <PageLoader /> : promos.length === 0 ? (
        <EmptyState title="Aucun code promo" description="Créez votre premier code de réduction ci-dessus." icon={<Ticket size={28} />} />
      ) : (
        <div className="flex flex-col gap-3">
          {promos.map((p) => {
            const st = statusOf(p)
            const val = p.discountType === 'percent' ? `-${p.discountValue}%` : `-${Math.round(p.discountValue / 100)} €`
            return (
              <div key={p.id} className="kz-card p-4 bg-white flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <code className="text-sm font-extrabold text-[#1A1410]">{p.code}</code>
                    <Badge color="violet" size="sm">{val}</Badge>
                    <Badge color={st.color} size="sm">{st.label}</Badge>
                  </div>
                  <div className="text-xs text-[#6B5A4A]">
                    {DUR[p.durationType]}{p.durationType === 'repeating' ? ` (${p.durationMonths})` : ''} ·
                    {p.startDate
                      ? ` du ${new Date(p.startDate).toLocaleDateString('fr-FR')}${p.endDate ? ` au ${new Date(p.endDate).toLocaleDateString('fr-FR')}` : ''}`
                      : p.endDate ? ` jusqu'au ${new Date(p.endDate).toLocaleDateString('fr-FR')}` : ' sans date de fin'} ·
                    {` ${p.usedCount}${p.maxRedemptions !== null ? `/${p.maxRedemptions}` : ''} utilisé(s)`}
                    {p.description ? ` · ${p.description}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button kind="soft" size="sm" icon={<CalendarClock size={13} />} onClick={() => extend(p)}>Prolonger</Button>
                  <Button kind="soft" size="sm" icon={<Zap size={13} />} onClick={() => patch(p.id, { applyActive: true })}>Appliquer aux actifs</Button>
                  <button onClick={() => patch(p.id, { active: !p.active })} title={p.active ? 'Désactiver' : 'Activer'}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FBEFE0]" style={{ color: p.active ? KZ.green : KZ.mute }}>
                    <Power size={15} />
                  </button>
                  <button onClick={() => remove(p.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#6B5A4A] hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
