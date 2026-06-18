'use client'

import { useEffect, useState } from 'react'
import { Wallet, Sparkles } from 'lucide-react'
import { KZ } from '@/lib/constants'

interface SectorSalary { count: number; min: number | null; avg: number | null; max: number | null }
interface AIEstimate   { min: number; max: number; median: number; source: 'ia' }

// ── Zones de référence 974 (brut annuel) ──────────────────────────
const SCALE_MIN = 15_000
const SCALE_MAX = 65_000
const RANGE     = SCALE_MAX - SCALE_MIN

const ZONES = [
  { to: 22_000, bg: '#F5ECD9', label: 'SMIC'        },
  { to: 27_600, bg: '#FFE0CF', label: 'Sous norme'  },
  { to: 40_000, bg: '#FFF1C2', label: 'Norme 974'   },
  { to: 65_000, bg: '#D6F0E0', label: 'Bien payé'   },
]

function pct(v: number) {
  return Math.max(0, Math.min(100, ((v - SCALE_MIN) / RANGE) * 100))
}

function fmt(v: number) {
  return `${Math.round(v / 1000)}k`
}

export function SalaryInsightsCard({
  sector, salaryMin, salaryMax, jobTitle, jobType,
}: {
  sector?:    string | null
  salaryMin?: number | null
  salaryMax?: number | null
  jobTitle?:  string | null
  jobType?:   string | null
}) {
  const [stats,      setStats]      = useState<SectorSalary | null>(null)
  const [aiEstimate, setAiEstimate] = useState<AIEstimate | null>(null)
  const [loaded,     setLoaded]     = useState(false)

  const hasOffer = !!(salaryMin || salaryMax)

  useEffect(() => {
    let alive = true

    // Stats marché réelles (toujours)
    fetch(`/api/salary-insights?sector=${encodeURIComponent(sector ?? '')}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (alive) setStats(d as SectorSalary | null) })
      .catch(() => {})

    if (!hasOffer) {
      // Estimation KazaIA si aucun salaire renseigné
      const p = new URLSearchParams({
        sector:   sector   ?? '',
        job_type: jobType  ?? 'CDI',
        title:    jobTitle ?? '',
      })
      fetch(`/api/ai/salary-estimate?${p}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (alive && d) setAiEstimate(d as AIEstimate) })
        .catch(() => {})
        .finally(() => { if (alive) setLoaded(true) })
    } else {
      setLoaded(true)
    }

    return () => { alive = false }
  }, [sector, hasOffer, jobTitle, jobType])

  const hasMarket = !!stats && stats.count > 0
  const rangeMin  = hasOffer ? (salaryMin ?? salaryMax!) : aiEstimate?.min  ?? null
  const rangeMax  = hasOffer ? (salaryMax ?? salaryMin!) : aiEstimate?.max  ?? null
  const showBar   = !!(rangeMin && rangeMax)

  if (loaded && !hasOffer && !aiEstimate && !hasMarket) return null

  // Widths of each zone segment (% of the bar)
  let prev = SCALE_MIN
  const zoneWidths = ZONES.map(z => {
    const w = ((z.to - prev) / RANGE) * 100
    prev = z.to
    return w
  })

  return (
    <div className="kz-card p-5 bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg border border-[#1A1410] flex items-center justify-center shrink-0"
          style={{ background: KZ.greenSoft }}>
          <Wallet size={13} color={KZ.green} />
        </div>
        <h2 className="text-base font-bold text-[#1A1410]">Fourchette salariale</h2>
        {!hasOffer && aiEstimate && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#6D3BEB]"
            style={{ background: KZ.violetSoft, color: KZ.violet }}>
            <Sparkles size={9} /> Estimation KazaIA
          </span>
        )}
      </div>
      <p className="text-xs text-[#6B5A4A] mb-4">
        {hasOffer
          ? 'Salaire proposé par l\'employeur (brut annuel).'
          : 'Estimation IA réaliste pour le marché 974/976 — à titre indicatif.'}
        {hasMarket && ` · ${stats!.count} offre${stats!.count > 1 ? 's' : ''} de référence dans ce secteur.`}
      </p>

      {/* ── Barre visuelle ───────────────────────────────────────── */}
      {showBar && (
        <div className="mb-4">
          {/* Montants min / médian / max au-dessus */}
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#6B5A4A]">Min</div>
              <div className="text-xl font-extrabold text-[#1A1410]">{fmt(rangeMin!)} €<span className="text-xs font-semibold text-[#6B5A4A]">/an</span></div>
            </div>
            {aiEstimate && !hasOffer && (
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase tracking-wide text-[#6B5A4A]">Médian</div>
                <div className="text-base font-bold text-[#1A1410]">{fmt(aiEstimate.median)} €/an</div>
              </div>
            )}
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#6B5A4A]">Max</div>
              <div className="text-xl font-extrabold text-[#1A1410]">{fmt(rangeMax!)} €<span className="text-xs font-semibold text-[#6B5A4A]">/an</span></div>
            </div>
          </div>

          {/* Barre */}
          <div className="relative rounded-xl overflow-hidden border-2 border-[#1A1410]" style={{ height: 40 }}>
            {/* Zones de couleur */}
            <div className="absolute inset-0 flex">
              {ZONES.map((z, i) => (
                <div key={i} style={{ width: `${zoneWidths[i]}%`, background: z.bg }} className="relative">
                  {i < ZONES.length - 1 && (
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-[#1A1410] opacity-20" />
                  )}
                </div>
              ))}
            </div>

            {/* Plage de l'offre */}
            <div
              className="absolute top-2 bottom-2 rounded-lg border-2 border-[#1A1410] transition-all"
              style={{
                left:       `${pct(rangeMin!)}%`,
                width:      `${Math.max(5, pct(rangeMax!) - pct(rangeMin!))}%`,
                background: hasOffer ? KZ.orange : KZ.violet,
                opacity:    0.82,
              }}
            />

            {/* Étiquettes zones */}
            <div className="absolute inset-0 flex pointer-events-none">
              {ZONES.map((z, i) => (
                <div key={i} style={{ width: `${zoneWidths[i]}%` }}
                  className="flex items-center justify-center">
                  <span className="text-[8px] font-bold text-[#6B5A4A] opacity-70 truncate px-0.5 select-none">
                    {z.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Graduations */}
          <div className="flex justify-between mt-1 px-0.5">
            {[15, 22, 28, 40, 65].map(k => (
              <span key={k} className="text-[10px] text-[#6B5A4A]">{k}k €</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Référence marché DB ──────────────────────────────────── */}
      {hasMarket && (
        <div className="rounded-xl border border-[#1A1410] overflow-hidden">
          <div className="px-3 py-1.5 text-[11px] font-bold text-white" style={{ background: KZ.violet }}>
            Référence marché — {sector} ({stats!.count} offre{stats!.count > 1 ? 's' : ''} Kazajob)
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#E8DDC9]">
            {[
              { label: 'Plancher', value: stats!.min },
              { label: 'Médiane',  value: stats!.avg },
              { label: 'Plafond',  value: stats!.max },
            ].map(row => (
              <div key={row.label} className="px-3 py-2 text-center">
                <div className="text-[10px] font-semibold text-[#6B5A4A]">{row.label}</div>
                <div className="text-xs font-bold text-[#1A1410] mt-0.5">
                  {row.value ? `${fmt(row.value)} €/an` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasMarket && !aiEstimate && loaded && (
        <p className="text-xs text-[#6B5A4A] italic">
          Pas encore assez d&apos;offres {sector ? `dans le secteur « ${sector} »` : ''} pour une référence marché.
          Les données s&apos;enrichissent à chaque nouvelle annonce publiée.
        </p>
      )}
    </div>
  )
}
