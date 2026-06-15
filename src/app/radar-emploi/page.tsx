import type { Metadata } from 'next'
import Link from 'next/link'
import { Briefcase, TrendingUp, MapPin, Layers, ArrowRight, Activity } from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import { Badge } from '@/components/ui/Badge'
import { getMarketRadar } from '@/lib/queries/marketData'
import { KZ } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Radar Emploi La Réunion & Mayotte — métiers qui recrutent, secteurs & salaires',
  description:
    'Le radar de l\'emploi à La Réunion (974) et Mayotte (976) : métiers qui recrutent, secteurs en tension, zones dynamiques et salaires indicatifs — calculés en temps réel sur les offres publiées sur Kazajob.',
  alternates: { canonical: 'https://kazajob.re/radar-emploi' },
  openGraph: {
    title: 'Radar Emploi La Réunion & Mayotte — Kazajob',
    description: 'Métiers qui recrutent, secteurs en tension et salaires indicatifs, en temps réel.',
    url: 'https://kazajob.re/radar-emploi',
  },
}

// Données temps réel → pas de cache statique.
export const dynamic = 'force-dynamic'

const fmtSalary = (min: number | null, max: number | null) => {
  if (!min && !max) return null
  const k = (n: number) => `${Math.round(n / 1000)}k€`
  if (min && max) return `${k(min)} – ${k(max)}/an`
  return `${k((min ?? max)!)}/an`
}

export default async function RadarEmploiPage() {
  const radar = await getMarketRadar()
  const maxRole = Math.max(1, ...radar.roles.map((r) => r.count))
  const maxLoc  = Math.max(1, ...radar.locations.map((l) => l.count))

  return (
    <PublicShell>
      {/* HERO */}
      <section className="px-4 sm:px-8 lg:px-16 pt-14 pb-10" style={{ background: KZ.ink }}>
        <div className="max-w-[1100px] mx-auto">
          <Badge color="violet" size="lg" className="mb-4">Radar Emploi · 974 / 976</Badge>
          <h1 className="text-3xl sm:text-[44px] font-extrabold tracking-[-0.03em] leading-[0.95] mb-4" style={{ color: KZ.cream }}>
            Le pouls de l&apos;emploi<br /><span style={{ color: KZ.orange }}>à La Réunion & Mayotte.</span>
          </h1>
          <p className="text-base max-w-[620px]" style={{ color: 'rgba(255,247,238,0.75)' }}>
            Métiers qui recrutent, secteurs en tension, zones dynamiques et salaires indicatifs — calculés en
            temps réel à partir des offres réellement publiées sur Kazajob.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="px-4 py-2.5 rounded-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <span className="text-2xl font-extrabold" style={{ color: KZ.cream }}>{radar.totalActive}</span>
              <span className="text-xs ml-2" style={{ color: 'rgba(255,247,238,0.6)' }}>offres actives</span>
            </div>
            <div className="px-4 py-2.5 rounded-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <span className="text-2xl font-extrabold" style={{ color: KZ.orange }}>+{radar.recent30}</span>
              <span className="text-xs ml-2" style={{ color: 'rgba(255,247,238,0.6)' }}>publiées sur 30 jours</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 lg:px-16 py-12">
        {radar.totalActive === 0 ? (
          <div className="kz-card p-10 bg-white text-center">
            <Activity size={36} className="mx-auto mb-3 opacity-30" />
            <h2 className="text-lg font-bold text-[#1A1410] mb-1">Le radar se met en route</h2>
            <p className="text-sm text-[#6B5A4A]">Les tendances apparaîtront ici dès que des offres seront publiées sur Kazajob.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Métiers qui recrutent */}
            <div className="kz-card p-6 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={18} color={KZ.violet} />
                <h2 className="text-lg font-extrabold text-[#1A1410]">Métiers qui recrutent</h2>
              </div>
              <div className="flex flex-col gap-2.5">
                {radar.roles.map((r) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="text-sm text-[#1A1410] w-40 sm:w-52 shrink-0 truncate">{r.label}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-[#F2E4D0] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(r.count / maxRole) * 100}%`, background: KZ.violet }} />
                    </div>
                    <span className="text-xs font-bold text-[#1A1410] w-8 text-right">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zones dynamiques */}
            <div className="kz-card p-6 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} color={KZ.orange} />
                <h2 className="text-lg font-extrabold text-[#1A1410]">Zones géographiques dynamiques</h2>
              </div>
              <div className="flex flex-col gap-2.5">
                {radar.locations.map((l) => (
                  <div key={l.label} className="flex items-center gap-3">
                    <span className="text-sm text-[#1A1410] w-40 sm:w-52 shrink-0 truncate">{l.label}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-[#F2E4D0] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(l.count / maxLoc) * 100}%`, background: KZ.orange }} />
                    </div>
                    <span className="text-xs font-bold text-[#1A1410] w-8 text-right">{l.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secteurs en tension + salaires */}
            <div className="kz-card p-6 bg-white lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Layers size={18} color={KZ.green} />
                <h2 className="text-lg font-extrabold text-[#1A1410]">Secteurs en tension & salaires indicatifs</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {radar.sectors.map((s) => {
                  const sal = fmtSalary(s.avgMin, s.avgMax)
                  return (
                    <div key={s.sector} className="rounded-xl border border-[#1A1410] p-3 flex items-center gap-3" style={{ background: KZ.cream2 }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#1A1410] truncate">{s.sector}</div>
                        <div className="text-xs text-[#6B5A4A]">{sal ? `Salaire moyen : ${sal}` : 'Salaire non communiqué'}</div>
                      </div>
                      <Badge color="green" size="sm">{s.count} offre{s.count > 1 ? 's' : ''}</Badge>
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-[#6B5A4A] italic mt-3">
                Salaires moyens calculés sur les offres avec rémunération renseignée. Indicatif.
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-[#1A1410] p-6 sm:p-8 text-center" style={{ background: KZ.violetSoft, boxShadow: '5px 5px 0 #1A1410' }}>
          <TrendingUp size={28} className="mx-auto mb-2" color={KZ.violet} />
          <h2 className="text-xl font-extrabold text-[#1A1410] mb-2">Trouvez votre prochain job péi</h2>
          <p className="text-sm text-[#6B5A4A] mb-4 max-w-[460px] mx-auto">Des centaines d&apos;opportunités locales, le matching IA et KazaCoach pour booster vos chances.</p>
          <Link href="/candidate/jobs">
            <span className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#1A1410] font-bold text-sm"
              style={{ background: KZ.orange, color: KZ.ink, boxShadow: '3px 3px 0 #1A1410' }}>
              Voir les offres <ArrowRight size={15} />
            </span>
          </Link>
        </div>
      </div>
    </PublicShell>
  )
}
