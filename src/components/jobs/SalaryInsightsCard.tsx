'use client'

import { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { formatSalary } from '@/lib/utils'
import { KZ } from '@/lib/constants'

interface SectorSalary { count: number; min: number | null; avg: number | null; max: number | null }

/**
 * Salary Insights — données RÉELLES : salaire affiché de l'offre + statistiques
 * du secteur calculées sur les offres réellement publiées sur Kazajob.
 */
export function SalaryInsightsCard({ sector, salaryMin, salaryMax }: {
  sector?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
}) {
  const [stats, setStats] = useState<SectorSalary | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let ok = true
    fetch(`/api/salary-insights?sector=${encodeURIComponent(sector ?? '')}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (ok) { setStats(d as SectorSalary | null); setLoaded(true) } })
      .catch(() => { if (ok) setLoaded(true) })
    return () => { ok = false }
  }, [sector])

  const hasOffer = !!(salaryMin || salaryMax)
  const hasMarket = !!stats && stats.count > 0

  // Rien de réel à afficher → on n'affiche pas la carte (pas de donnée inventée).
  if (loaded && !hasOffer && !hasMarket) return null

  return (
    <div className="kz-card p-5 bg-white">
      <div className="flex items-center gap-2 mb-1">
        <Wallet size={16} color={KZ.green} />
        <h2 className="text-base font-bold text-[#1A1410]">Estimations salariales</h2>
      </div>
      <p className="text-sm text-[#6B5A4A] mb-4">Basé sur les offres réelles publiées sur Kazajob.</p>

      {hasOffer && (
        <div className="rounded-xl border border-[#1A1410] p-3 mb-3" style={{ background: KZ.greenSoft }}>
          <div className="text-xs font-bold uppercase tracking-wide text-[#6B5A4A] mb-0.5">Salaire de cette offre</div>
          <div className="text-lg font-extrabold text-[#1A1410]">{formatSalary(salaryMin ?? null, salaryMax ?? null)}</div>
        </div>
      )}

      {hasMarket ? (
        <div className="rounded-xl border border-[#1A1410] overflow-hidden">
          <div className="px-3 py-2 text-xs font-bold text-white" style={{ background: KZ.violet }}>
            Marché du secteur {sector} — {stats!.count} offre{stats!.count > 1 ? 's' : ''} sur Kazajob
          </div>
          <div className="divide-y divide-[#E8DDC9]">
            {[
              { label: 'Entrée de fourchette', value: stats!.min },
              { label: 'Salaire médian', value: stats!.avg },
              { label: 'Haut de fourchette', value: stats!.max },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold text-[#6B5A4A]">{row.label}</span>
                <span className="text-xs font-bold text-[#1A1410]">
                  {row.value ? `${row.value.toLocaleString('fr-FR')} € / an` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : loaded ? (
        <p className="text-xs text-[#6B5A4A] italic">
          Pas encore assez d&apos;offres {sector ? `dans le secteur « ${sector} »` : ''} pour une estimation marché fiable. Ces données s&apos;enrichissent à chaque nouvelle offre.
        </p>
      ) : null}
    </div>
  )
}
