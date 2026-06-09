'use client'

import { useEffect, useState } from 'react'
import { Download, TrendingUp, Users, Briefcase, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { KZ } from '@/lib/constants'

interface WeekBucket { label: string; users: number; jobs: number; apps: number }
interface TopCity    { city: string; count: number }
interface TopSector  { sector: string; count: number }

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-6 rounded-lg overflow-hidden border border-[#1A1410]" style={{ background: KZ.cream2 }}>
        <div
          className="h-full rounded-lg transition-all duration-500 flex items-center px-2"
          style={{ width: `${Math.max(pct, 4)}%`, background: color }}
        >
          {pct > 15 && <span className="text-[10px] font-bold text-white">{value}</span>}
        </div>
      </div>
      {pct <= 15 && <span className="text-xs font-bold text-[#1A1410] w-6 text-right">{value}</span>}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [weeks, setWeeks]       = useState<WeekBucket[]>([])
  const [topCities, setTopCities] = useState<TopCity[]>([])
  const [topSectors, setTopSectors] = useState<TopSector[]>([])
  const [totals, setTotals]     = useState({ users: 0, jobs: 0, apps: 0, companies: 0 })
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      let profiles: { created_at: string }[] = []
      let jobs: { created_at: string; location: string; sector: string | null }[] = []
      let apps: { created_at: string }[] = []
      try {
        const res = await fetch('/api/admin/analytics')
        if (res.ok) {
          const d = await res.json()
          profiles = d.profiles ?? []
          jobs = d.jobs ?? []
          apps = d.apps ?? []
          setTotals({
            users: d.totals?.users ?? 0, jobs: d.totals?.jobs ?? 0,
            apps: d.totals?.apps ?? 0, companies: d.totals?.companies ?? 0,
          })
        }
      } catch { /* noop */ }

      // Construire les buckets hebdomadaires (8 dernières semaines)
      const buckets: WeekBucket[] = []
      for (let i = 7; i >= 0; i--) {
        const start = new Date(); start.setDate(start.getDate() - i * 7 - 6); start.setHours(0,0,0,0)
        const end   = new Date(); end.setDate(end.getDate() - i * 7 + 1);   end.setHours(0,0,0,0)
        const label = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        const inRange = (d: string) => { const t = new Date(d); return t >= start && t < end }
        buckets.push({
          label,
          users: (profiles ?? []).filter(p => inRange(p.created_at)).length,
          jobs:  (jobs ?? []).filter(j => inRange(j.created_at)).length,
          apps:  (apps ?? []).filter(a => inRange(a.created_at)).length,
        })
      }
      setWeeks(buckets)

      // Top villes
      const cityMap = new Map<string, number>()
      ;(jobs ?? []).forEach((j: { location: string }) => {
        const c = (j.location ?? '').split(',')[0].trim()
        if (c) cityMap.set(c, (cityMap.get(c) ?? 0) + 1)
      })
      setTopCities([...cityMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([city,count])=>({city,count})))

      // Top secteurs
      const secMap = new Map<string, number>()
      ;(jobs ?? []).forEach((j: { sector: string | null }) => {
        const s = j.sector ?? 'Autre'
        secMap.set(s, (secMap.get(s) ?? 0) + 1)
      })
      setTopSectors([...secMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([sector,count])=>({sector,count})))

      setLoading(false)
    }
    load()
  }, [])

  const exportCSV = () => {
    const rows = [
      ['Semaine', 'Nouveaux utilisateurs', 'Nouvelles offres', 'Candidatures'],
      ...weeks.map(w => [w.label, w.users, w.jobs, w.apps]),
      [],
      ['Total utilisateurs', totals.users],
      ['Total offres', totals.jobs],
      ['Total candidatures', totals.apps],
      ['Total entreprises', totals.companies],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `kazajob-analytics-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const maxUsers  = Math.max(...weeks.map(w => w.users), 1)
  const maxJobs   = Math.max(...weeks.map(w => w.jobs), 1)
  const maxApps   = Math.max(...weeks.map(w => w.apps), 1)
  const maxCities = Math.max(...topCities.map(c => c.count), 1)
  const maxSec    = Math.max(...topSectors.map(s => s.count), 1)

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1410]">Analytics & Rapports</h1>
          <p className="text-sm text-[#6B5A4A] mt-1">Données des 8 dernières semaines</p>
        </div>
        <Button kind="outline" size="md" icon={<Download size={15} />} onClick={exportCSV}>
          Exporter CSV
        </Button>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Utilisateurs total', value: totals.users, icon: <Users size={16} />, color: KZ.violetSoft },
          { label: 'Offres total',        value: totals.jobs,  icon: <Briefcase size={16} />, color: KZ.orangeSoft },
          { label: 'Candidatures total',  value: totals.apps,  icon: <FileText size={16} />, color: KZ.yellowSoft },
          { label: 'Entreprises total',   value: totals.companies, icon: <TrendingUp size={16} />, color: KZ.greenSoft },
        ].map(k => (
          <div key={k.label} className="kz-card p-4 bg-white text-center" style={{ background: k.color }}>
            <div className="flex items-center justify-center mb-1">{k.icon}</div>
            <div className="text-2xl font-extrabold text-[#1A1410]">{k.value.toLocaleString('fr-FR')}</div>
            <div className="text-[11px] text-[#6B5A4A] font-semibold mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-[#FBEFE0] animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
          {/* Graphiques semaine par semaine */}
          <div className="flex flex-col gap-4">
            {[
              { label: 'Nouveaux utilisateurs / semaine', key: 'users', color: KZ.violet, max: maxUsers },
              { label: 'Nouvelles offres / semaine',       key: 'jobs',  color: KZ.orange, max: maxJobs },
              { label: 'Candidatures / semaine',           key: 'apps',  color: KZ.green,  max: maxApps },
            ].map(({ label, key, color, max }) => (
              <div key={key} className="kz-card p-5 bg-white">
                <h2 className="text-sm font-bold text-[#1A1410] mb-4">{label}</h2>
                <div className="flex flex-col gap-2">
                  {weeks.map(w => (
                    <div key={w.label} className="grid grid-cols-[68px_1fr] gap-2 items-center">
                      <span className="text-[11px] text-[#6B5A4A] text-right font-medium">{w.label}</span>
                      <Bar value={(w as unknown as Record<string, number>)[key] ?? 0} max={max} color={color} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Top villes + secteurs */}
          <div className="flex flex-col gap-4">
            <div className="kz-card p-5 bg-white">
              <h2 className="text-sm font-bold text-[#1A1410] mb-4">Top villes (offres)</h2>
              <div className="flex flex-col gap-2.5">
                {topCities.length === 0 ? (
                  <p className="text-xs text-[#6B5A4A]">Pas de données.</p>
                ) : topCities.map(({ city, count }) => (
                  <div key={city} className="grid grid-cols-[90px_1fr] gap-2 items-center">
                    <span className="text-[11px] text-[#6B5A4A] truncate font-medium">{city}</span>
                    <Bar value={count} max={maxCities} color={KZ.blue} />
                  </div>
                ))}
              </div>
            </div>

            <div className="kz-card p-5 bg-white">
              <h2 className="text-sm font-bold text-[#1A1410] mb-4">Top secteurs (offres)</h2>
              <div className="flex flex-col gap-2.5">
                {topSectors.length === 0 ? (
                  <p className="text-xs text-[#6B5A4A]">Pas de données.</p>
                ) : topSectors.map(({ sector, count }) => (
                  <div key={sector} className="grid grid-cols-[110px_1fr] gap-2 items-center">
                    <span className="text-[11px] text-[#6B5A4A] truncate font-medium">{sector}</span>
                    <Bar value={count} max={maxSec} color={KZ.green} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
