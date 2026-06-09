'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, Star } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { KZ, SUBSCRIPTION_PLANS } from '@/lib/constants'
import type { BadgeColor } from '@/lib/types'

interface SubRow {
  id: string
  plan_id: string
  status: string
  trial_ends_at: string | null
  current_period_end: string | null
  seats_used: number
  created_at: string
  company: { name: string; is_verified: boolean } | null
}

const STATUS_BADGE: Record<string, BadgeColor> = {
  trial: 'yellow', active: 'green', cancelled: 'orange', expired: 'cream',
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs]   = useState<SubRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/subscriptions')
        if (res.ok) setSubs((await res.json()) as SubRow[])
      } catch { /* noop */ }
      setLoading(false)
    }
    load()
  }, [])

  // KPIs
  const mrr = subs
    .filter(s => s.status === 'active')
    .reduce((acc, s) => {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === s.plan_id)
      return acc + (plan?.priceCts ?? 0)
    }, 0)

  const trialing  = subs.filter(s => s.status === 'trial').length
  const actives   = subs.filter(s => s.status === 'active').length
  const cancelled = subs.filter(s => s.status === 'cancelled' || s.status === 'expired').length

  const patchSub = async (subId: string, body: Record<string, string>) => {
    await fetch(`/api/admin/subscriptions/${subId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  const handleChangePlan = async (subId: string, newPlanId: string) => {
    await patchSub(subId, { planId: newPlanId })
    setSubs(prev => prev.map(s => s.id === subId ? { ...s, plan_id: newPlanId } : s))
  }

  const handleChangeStatus = async (subId: string, newStatus: string) => {
    await patchSub(subId, { status: newStatus })
    setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: newStatus } : s))
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1A1410]">Abonnements</h1>
        <p className="text-sm text-[#6B5A4A] mt-1">Gestion des forfaits entreprises</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'MRR estimé', value: `${Math.floor(mrr / 100)}€`, icon: <TrendingUp size={16} />, color: KZ.greenSoft },
          { label: 'Essais actifs', value: trialing, icon: <Star size={16} />, color: KZ.yellowSoft },
          { label: 'Abonnés actifs', value: actives, icon: <Users size={16} />, color: KZ.violetSoft },
          { label: 'Résiliés', value: cancelled, icon: <Users size={16} />, color: KZ.orangeSoft },
        ].map(k => (
          <div key={k.label} className="kz-card p-4 bg-white text-center" style={{ background: k.color }}>
            <div className="flex justify-center mb-1">{k.icon}</div>
            <div className="text-2xl font-extrabold text-[#1A1410]">{k.value}</div>
            <div className="text-xs text-[#6B5A4A] font-semibold mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="kz-card bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
              <th className="text-left p-3 font-bold text-[#1A1410]">Entreprise</th>
              <th className="text-left p-3 font-bold text-[#1A1410]">Forfait</th>
              <th className="text-center p-3 font-bold text-[#1A1410]">Statut</th>
              <th className="text-center p-3 font-bold text-[#1A1410]">Sièges</th>
              <th className="text-left p-3 font-bold text-[#1A1410]">Échéance</th>
              <th className="text-left p-3 font-bold text-[#1A1410]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-[#6B5A4A]">Chargement...</td></tr>
            ) : subs.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-[#6B5A4A]">Aucun abonnement.</td></tr>
            ) : subs.map(sub => {
              const plan = SUBSCRIPTION_PLANS.find(p => p.id === sub.plan_id)
              const co = sub.company
              const expiry = sub.status === 'trial' ? sub.trial_ends_at : sub.current_period_end
              return (
                <tr key={sub.id} className="border-b border-[#E8DDC9] last:border-0 hover:bg-[#FBEFE0] transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-[#1A1410]">{co?.name ?? '—'}</div>
                  </td>
                  <td className="p-3">
                    <select
                      className="text-xs px-2 py-1 rounded-lg border border-[#E8DDC9] bg-white focus:outline-none"
                      value={sub.plan_id}
                      onChange={e => handleChangePlan(sub.id, e.target.value)}
                    >
                      {SUBSCRIPTION_PLANS.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {Math.floor(p.priceCts / 100)}€</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    <Badge color={STATUS_BADGE[sub.status] ?? 'cream'} size="sm">
                      {sub.status === 'trial' ? 'Essai' : sub.status === 'active' ? 'Actif' : sub.status === 'cancelled' ? 'Résilié' : 'Expiré'}
                    </Badge>
                  </td>
                  <td className="p-3 text-center text-xs font-bold text-[#1A1410]">
                    {sub.seats_used}/{plan?.maxMembers ?? '?'}
                  </td>
                  <td className="p-3 text-xs text-[#6B5A4A]">
                    {expiry ? new Date(expiry).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                  </td>
                  <td className="p-3">
                    <select
                      className="text-xs px-2 py-1 rounded-lg border border-[#E8DDC9] bg-white focus:outline-none"
                      value={sub.status}
                      onChange={e => handleChangeStatus(sub.id, e.target.value)}
                    >
                      <option value="trial">Essai</option>
                      <option value="active">Activer</option>
                      <option value="cancelled">Résilier</option>
                      <option value="expired">Expirer</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
