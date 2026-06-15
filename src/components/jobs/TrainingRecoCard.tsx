'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Clock, Award, ArrowRight, TrendingUp } from 'lucide-react'
import { KZ } from '@/lib/constants'

interface TrainingReco {
  id: string
  title: string
  sector: string | null
  certificationLevel: string | null
  duration: string
  isFinanced: boolean
  financingOptions: string[]
  location: string
}

/**
 * « Pour améliorer vos chances » — formations RÉELLES du catalogue Kazajob
 * (par secteur), affichées quand le candidat n'est pas totalement compatible.
 */
export function TrainingRecoCard({ sector }: { sector?: string | null }) {
  const [recos, setRecos] = useState<TrainingReco[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let ok = true
    fetch(`/api/training-reco?sector=${encodeURIComponent(sector ?? '')}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (ok) { setRecos((d as TrainingReco[]) ?? []); setLoaded(true) } })
      .catch(() => { if (ok) setLoaded(true) })
    return () => { ok = false }
  }, [sector])

  if (!loaded) return null

  return (
    <div className="kz-card p-5" style={{ background: KZ.greenSoft, borderColor: KZ.green }}>
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={16} color={KZ.green} />
        <h2 className="text-base font-bold text-[#1A1410]">Pour améliorer vos chances</h2>
      </div>

      {recos.length > 0 ? (
        <>
          <p className="text-sm text-[#2A2018] mb-4">Des formations disponibles à La Réunion pour renforcer votre profil :</p>
          <div className="flex flex-col gap-2.5">
            {recos.map((r) => (
              <Link key={r.id} href={`/candidate/training/${r.id}`} className="block rounded-xl border border-[#1A1410] bg-white p-3 hover:shadow-[3px_3px_0_#1A1410] transition-all">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <GraduationCap size={14} color={KZ.violet} />
                  <span className="text-sm font-bold text-[#1A1410]">{r.title}</span>
                  {r.isFinanced && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1A1410]" style={{ background: KZ.yellowSoft }}>
                      {r.financingOptions[0] ?? 'Financée'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B5A4A]">
                  <span>{r.location}</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{r.duration}</span>
                  {r.certificationLevel && <span className="flex items-center gap-1"><Award size={11} />{r.certificationLevel}</span>}
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-[#2A2018] mb-4">
          Explorez les formations disponibles à La Réunion pour renforcer votre profil sur ce type de poste.
        </p>
      )}

      <Link href="/candidate/training" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: KZ.violet }}>
        Voir toutes les formations <ArrowRight size={14} />
      </Link>
    </div>
  )
}
