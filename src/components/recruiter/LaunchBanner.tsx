'use client'

/**
 * Bannière persistante de la campagne de lancement (dashboard recruteur).
 * Compte à rebours réel (jamais factice), consommation, et niveau d'alerte
 * progressif selon les jours restants. Non intrusive.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Rocket, ArrowUpRight, Clock } from 'lucide-react'
import { KZ } from '@/lib/constants'

interface Status {
  onLaunch: boolean
  expired?: boolean
  daysLeft?: number
  expiresAt?: string | null
  alertLevel?: 'info' | 'reminder' | 'warning' | 'urgent' | 'expired'
  campaignName?: string
  jobsUsed?: number; jobsMax?: number
}

const STYLE: Record<string, { bg: string; border: string }> = {
  info:     { bg: KZ.violetSoft, border: KZ.violet },
  reminder: { bg: KZ.violetSoft, border: KZ.violet },
  warning:  { bg: KZ.yellowSoft, border: KZ.yellow },
  urgent:   { bg: KZ.orangeSoft, border: KZ.orange },
  expired:  { bg: '#FDE2E2', border: '#E54E4E' },
}

export function LaunchBanner() {
  const [s, setS] = useState<Status | null>(null)

  useEffect(() => {
    fetch('/api/launch/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.onLaunch) setS(d) })
      .catch(() => {})
  }, [])

  if (!s) return null
  const level = s.alertLevel ?? 'info'
  const st = STYLE[level]
  const endStr = s.expiresAt
    ? new Date(s.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="kz-card p-4 mb-5" style={{ background: st.bg, borderColor: st.border }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-[#1A1410] flex items-center justify-center" style={{ background: 'white' }}>
            <Rocket size={16} className="text-[#6D3BEB]" />
          </div>
          <div>
            <div className="font-extrabold text-[#1A1410] text-sm flex items-center gap-1.5">
              {s.campaignName ?? 'Accès gratuit'}
              {s.expired
                ? <span className="text-[#E54E4E]">· offre expirée</span>
                : <span className="flex items-center gap-1 text-[#6B5A4A]"><Clock size={12} /> {s.daysLeft} j restants</span>}
            </div>
            <div className="text-xs text-[#6B5A4A]">
              {s.expired
                ? 'Choisissez un forfait payant pour publier à nouveau. Vos données restent accessibles.'
                : `Gratuit jusqu'au ${endStr} · ${s.jobsUsed}/${s.jobsMax} offres actives`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/recruiter/company"
            className="text-xs font-bold px-3 py-2 rounded-lg border border-[#1A1410] bg-white hover:bg-[#FBEFE0] transition-colors">
            Comparer les offres
          </Link>
          <Link href="/recruiter/company"
            className="text-xs font-bold px-3 py-2 rounded-lg border border-[#1A1410] flex items-center gap-1 hover:opacity-90 transition-opacity"
            style={{ background: KZ.violet, color: 'white' }}>
            Passer à une offre supérieure <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  )
}
