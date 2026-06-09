'use client'

import { useState, useEffect } from 'react'
import { KZ } from '@/lib/constants'

interface KazaScoreData {
  score: number
  label: string
  total_apps: number
  responded: number
  avg_hours: number
  with_interview: number
}

interface KazaScoreBadgeProps {
  recruiterId: string
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

const SCORE_STYLE = (score: number) => {
  if (score >= 85) return { color: KZ.green,  bg: KZ.greenSoft,  ring: KZ.green }
  if (score >= 65) return { color: KZ.violet, bg: KZ.violetSoft, ring: KZ.violet }
  if (score >= 40) return { color: KZ.orange, bg: KZ.orangeSoft, ring: KZ.orange }
  return { color: KZ.mute, bg: KZ.cream2, ring: KZ.mute }
}

export function KazaScoreBadge({ recruiterId, size = 'md', showDetails = false }: KazaScoreBadgeProps) {
  const [data, setData]     = useState<KazaScoreData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!recruiterId) return
    const fetchScore = async () => {
      try {
        const res = await fetch(`/api/kaza-score/${recruiterId}`)
        if (res.ok) setData((await res.json()) as KazaScoreData)
      } catch { /* noop */ }
      setLoading(false)
    }
    fetchScore()
  }, [recruiterId])

  if (loading) return null
  if (!data || data.total_apps === 0) {
    if (size === 'sm') return null
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#6B5A4A] px-2 py-1 rounded-full border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
        Nouveau recruteur
      </span>
    )
  }

  const style  = SCORE_STYLE(data.score)
  const radius = size === 'lg' ? 28 : size === 'md' ? 22 : 16
  const stroke = size === 'lg' ? 4  : size === 'md' ? 3  : 2.5
  const circ   = 2 * Math.PI * radius
  const dash   = (data.score / 100) * circ

  // ── Inline badge (sm) ──────────────────────────────────────
  if (size === 'sm') {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full border border-[#1A1410]"
        style={{ background: style.bg, color: KZ.ink }}
        title={`KazaScore : ${data.score}/100 — ${data.label}`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <circle cx="6" cy="6" r="4" fill="none" stroke={style.color} strokeWidth="2" strokeOpacity="0.3" />
          <circle cx="6" cy="6" r="4" fill="none" stroke={style.color} strokeWidth="2"
            strokeDasharray={`${(data.score / 100) * (2 * Math.PI * 4)} 100`}
            strokeLinecap="round" transform="rotate(-90 6 6)" />
        </svg>
        {data.score}
      </span>
    )
  }

  // ── Badge medium / large avec jauge circulaire ─────────────
  const svgSize = (radius + stroke) * 2 + 4
  const cx = svgSize / 2
  const cy = svgSize / 2

  return (
    <div className={`inline-flex items-center gap-3 ${showDetails ? 'w-full' : ''}`}>
      {/* Jauge circulaire */}
      <div className="relative shrink-0">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          {/* Track */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke={style.color} strokeWidth={stroke} strokeOpacity="0.15" />
          {/* Progress */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={style.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        {/* Score au centre */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-extrabold leading-none"
            style={{ fontSize: size === 'lg' ? 16 : 13, color: style.color }}
          >
            {data.score}
          </span>
        </div>
      </div>

      {/* Texte */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-[#1A1410]">KazaScore</span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1A1410]"
            style={{ background: style.bg, color: style.color }}
          >
            {data.label}
          </span>
        </div>
        {showDetails && (
          <div className="flex gap-3 mt-1 flex-wrap">
            <span className="text-xs text-[#6B5A4A]">{data.responded}/{data.total_apps} réponses</span>
            <span className="text-xs text-[#6B5A4A]">
              {data.avg_hours < 24
                ? `Répond en ${Math.round(data.avg_hours)}h`
                : `Répond en ${Math.round(data.avg_hours / 24)}j`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/** Version compacte pour les fiches offres */
export function KazaScoreMini({ recruiterId }: { recruiterId: string }) {
  return <KazaScoreBadge recruiterId={recruiterId} size="sm" />
}

/** Version bloc pour le dashboard recruteur */
export function KazaScoreCard({ recruiterId }: { recruiterId: string }) {
  return (
    <div className="kz-card p-5 bg-white">
      <p className="kz-eyebrow text-[#6B5A4A] mb-3">Votre KazaScore</p>
      <KazaScoreBadge recruiterId={recruiterId} size="lg" showDetails />
      <p className="text-xs text-[#6B5A4A] mt-3 leading-relaxed">
        Calculé sur les 90 derniers jours · Visible par les candidats sur vos offres.
        Répondez rapidement pour améliorer votre score.
      </p>
    </div>
  )
}
