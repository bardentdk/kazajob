'use client'

import { useEffect, useState } from 'react'
import { Eye, BarChart2 } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { KZ } from '@/lib/constants'

interface Traffic {
  days: number
  total: number
  top: { path: string; views: number }[]
  daily: { day: string; views: number }[]
}

const PERIODS = [7, 30, 90]

export default function AdminTrafficPage() {
  const [data, setData] = useState<Traffic | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/traffic?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d as Traffic))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [days])

  const maxDay = Math.max(1, ...(data?.daily.map((d) => d.views) ?? [1]))
  const maxTop = Math.max(1, ...(data?.top.map((t) => t.views) ?? [1]))

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Analytics</p>
          <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">Trafic du site</h1>
          <p className="text-sm text-[#6B5A4A] mt-1">Pages vues anonymes (sans cookie). Pour le détail (sources, pays, visiteurs uniques) : dashboard Vercel.</p>
        </div>
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full border border-[#1A1410] shrink-0" style={{ background: KZ.paper }}>
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setDays(p)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={days === p ? { background: KZ.violet, color: 'white' } : { color: KZ.mute }}>
              {p}j
            </button>
          ))}
        </div>
      </div>

      {loading ? <PageLoader /> : !data || data.total === 0 ? (
        <EmptyState
          title="Pas encore de données de trafic"
          description="Les vues de pages s'enregistrent dès que des visiteurs naviguent sur le site (hors espace admin)."
          icon={<BarChart2 size={28} />}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            <StatCard label={`Vues (${data.days} j)`} value={data.total.toLocaleString('fr-FR')} color={KZ.violetSoft} icon={<Eye size={15} />} />
            <StatCard label="Pages distinctes" value={data.top.length} color={KZ.orangeSoft} icon={<BarChart2 size={15} />} />
            <StatCard label="Moy. / jour" value={Math.round(data.total / data.days).toLocaleString('fr-FR')} color={KZ.greenSoft} icon={<Eye size={15} />} />
          </div>

          {/* Vues par jour */}
          <div className="kz-card p-5 bg-white mb-5">
            <h2 className="text-base font-bold text-[#1A1410] mb-4">Vues par jour</h2>
            <div className="flex items-end gap-1.5 h-40 overflow-x-auto">
              {data.daily.map((d) => (
                <div key={d.day} className="flex-1 min-w-[8px] flex flex-col items-center gap-1 group" title={`${d.day} — ${d.views} vues`}>
                  <div className="w-full rounded-t border border-[#1A1410]" style={{ height: `${Math.max(3, (d.views / maxDay) * 130)}px`, background: KZ.violetSoft }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-[#6B5A4A] mt-2">
              <span>{data.daily[0]?.day}</span>
              <span>{data.daily[data.daily.length - 1]?.day}</span>
            </div>
          </div>

          {/* Pages les plus consultées */}
          <div className="kz-card p-5 bg-white">
            <h2 className="text-base font-bold text-[#1A1410] mb-4">Pages les plus consultées</h2>
            <div className="flex flex-col gap-2.5">
              {data.top.map((t) => (
                <div key={t.path} className="flex items-center gap-3">
                  <code className="text-xs text-[#1A1410] w-48 sm:w-64 shrink-0 truncate">{t.path}</code>
                  <div className="flex-1 h-2.5 rounded-full bg-[#F2E4D0] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(t.views / maxTop) * 100}%`, background: KZ.violet }} />
                  </div>
                  <span className="text-xs font-bold text-[#1A1410] w-12 text-right">{t.views.toLocaleString('fr-FR')}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
