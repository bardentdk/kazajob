'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Clock, MessageSquareReply, Activity, Briefcase } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { KZ } from '@/lib/constants'

interface Reputation {
  isVerified: boolean
  jobsActive: number
  jobsTotal: number
  applicationsTotal: number
  responseRate: number | null
  avgResponseDays: number | null
  lastActiveDays: number | null
}

/** Réputation employeur — indicateurs RÉELS (sans système d'avis). */
export function EmployerReputation({ companyId }: { companyId?: string | null }) {
  const [rep, setRep] = useState<Reputation | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!companyId) { setLoaded(true); return }
    let ok = true
    fetch(`/api/companies/${companyId}/reputation`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (ok) { setRep(d as Reputation); setLoaded(true) } })
      .catch(() => { if (ok) setLoaded(true) })
    return () => { ok = false }
  }, [companyId])

  if (!loaded || !rep) return null

  const activeLabel = rep.lastActiveDays === null ? null
    : rep.lastActiveDays <= 1 ? "Actif aujourd'hui"
    : rep.lastActiveDays <= 7 ? 'Actif cette semaine'
    : rep.lastActiveDays <= 30 ? 'Actif ce mois-ci'
    : `Actif il y a ${Math.round(rep.lastActiveDays / 30)} mois`

  const rows = [
    rep.responseRate !== null && { icon: <MessageSquareReply size={13} />, label: 'Taux de réponse', value: `${rep.responseRate}%` },
    rep.avgResponseDays !== null && { icon: <Clock size={13} />, label: 'Délai moyen de réponse', value: rep.avgResponseDays <= 1 ? '≤ 1 jour' : `~ ${rep.avgResponseDays} jours` },
    { icon: <Briefcase size={13} />, label: 'Offres publiées', value: rep.jobsActive > 0 ? `${rep.jobsActive} active${rep.jobsActive > 1 ? 's' : ''}` : `${rep.jobsTotal}` },
    activeLabel && { icon: <Activity size={13} />, label: 'Activité', value: activeLabel },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[]

  return (
    <div className="kz-card p-5 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-base font-bold text-[#1A1410]">Réputation employeur</h3>
        {rep.isVerified && (
          <Badge color="green" size="sm"><span className="flex items-center gap-1"><ShieldCheck size={11} />Vérifiée</span></Badge>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2 text-sm">
            <span className="text-[#6B5A4A]">{r.icon}</span>
            <span className="text-[#6B5A4A] flex-1">{r.label}</span>
            <span className="font-bold text-[#1A1410]">{r.value}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[#6B5A4A] italic mt-3">Indicateurs calculés sur l&apos;activité réelle de l&apos;entreprise sur Kazajob.</p>
    </div>
  )
}
