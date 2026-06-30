'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Building2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KZ, PAID_PLANS, planFeatures } from '@/lib/constants'

const CANDIDATE_FEATURES = [
  'Accès à toutes les offres La Réunion',
  'Candidature 1 clic',
  'Matching IA personnalisé',
  'KazaIA — lettres & préparation entretien',
  'CV Builder visuel inclus',
]

export function PricingSection() {
  // Bandeau d'annonce (texte seul, jamais une tuile tarifaire) : reflète la campagne
  // de lancement pilotée par l'admin, indépendante des forfaits ci-dessous.
  const [campaignName, setCampaignName] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/launch/public').then((r) => (r.ok ? r.json() : null)).then((d) => setCampaignName(d?.available ? d.campaignName : null)).catch(() => {})
  }, [])

  return (
    <section id="tarifs" className="px-4 sm:px-8 lg:px-16 py-16 lg:py-24" style={{ background: KZ.cream }}>
      <div className="max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="kz-eyebrow mb-3" style={{ color: KZ.violet }}>Tarifs recruteurs</p>
          <h2 className="text-3xl lg:text-[44px] font-extrabold tracking-tight text-[#1A1410] mb-4">
            Transparent, local,<br />
            <span style={{ color: KZ.violet }}>sans mauvaise surprise.</span>
          </h2>
          <p className="text-base text-[#6B5A4A] max-w-[520px] mx-auto">
            Les candidats accèdent à <strong className="text-[#1A1410]">100% des fonctionnalités gratuitement</strong>, pour toujours.
            {' '}Les recruteurs choisissent leur forfait selon leurs besoins. Essai 30 jours, carte requise à l&apos;activation.
          </p>
          {campaignName && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full" style={{ background: KZ.violetSoft, color: KZ.violet }}>
              <Badge color="orange" size="sm">Campagne en cours</Badge>
              {campaignName} : accès gratuit temporaire pour les entreprises éligibles, sans carte bancaire.
              <Link href="/recruiter/company" className="underline">En savoir plus</Link>
            </p>
          )}
        </div>

        {/* Forfaits recruteur — grille 4 colonnes, source unique : PAID_PLANS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Forfaits payants — source unique : PAID_PLANS */}
          {PAID_PLANS.map((plan) => {
            const euros = Math.floor(plan.priceCts / 100)
            const hl = plan.highlight
            return (
              <div key={plan.id} className="kz-card p-6 flex flex-col"
                style={{
                  background: hl ? KZ.violet : 'white',
                  color: hl ? 'white' : KZ.ink,
                  boxShadow: hl ? '6px 6px 0 #1A1410' : '3px 3px 0 #1A1410',
                }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-bold opacity-80">{plan.name}</span>
                  {hl && <Badge color="orange" size="sm">Populaire</Badge>}
                </div>
                <div className="text-[36px] font-extrabold tracking-tight leading-none mb-1">
                  {euros}€<span className="text-sm font-semibold opacity-60">/mois</span>
                </div>
                <div className="text-xs opacity-60 mb-4">30 jours d&apos;essai · 1er débit après l&apos;essai</div>
                <div className="flex flex-col gap-2 mb-6 flex-1">
                  {planFeatures(plan).map((f: string) => (
                    <div key={f} className="flex items-start gap-2 text-sm">
                      <Check size={14} className="mt-0.5 shrink-0" style={{ color: hl ? KZ.orange : KZ.green }} />
                      <span style={{ opacity: hl ? 0.9 : 0.85 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href={`/auth/register?role=recruiter&plan=${plan.id}`}>
                  <Button kind={hl ? 'primary' : 'outline'} size="lg" full iconRight={<ArrowRight size={14} />}>
                    Essai gratuit 30 jours
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-[#6B5A4A] mb-10">
          Tarifs nets · TVA non applicable, art. 293 B du CGI (micro-entreprise).
        </p>

        {/* Plan candidat — toujours gratuit */}
        <div className="rounded-2xl border border-[#1A1410] overflow-hidden"
          style={{ background: KZ.ink, boxShadow: '5px 5px 0 ' + KZ.violet }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center shrink-0" style={{ background: KZ.violet }}>
                <Building2 size={18} color="white" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-white leading-tight">
                  Candidat &mdash; <span style={{ color: KZ.orange }}>100% gratuit, pour toujours</span>
                </div>
                <div className="text-xs text-white/60 mt-0.5">Kazajob ne facturera jamais les candidats.</div>
              </div>
            </div>
            <Link href="/auth/register" className="shrink-0">
              <Button kind="primary" size="md">Créer mon compte gratuit</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 divide-x divide-y divide-white/10">
            {CANDIDATE_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2 px-4 py-3">
                <Check size={13} color={KZ.green} className="shrink-0" />
                <span className="text-xs font-semibold text-white/75 leading-tight">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Garanties */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Sans engagement', desc: 'Annulation à tout moment' },
            { label: 'Données en Europe', desc: 'RGPD conforme · Hébergement EU' },
            { label: 'Essai 30 jours', desc: 'Carte requise · débit après 30j' },
            { label: 'Support 974', desc: 'Équipe locale' },
          ].map((g) => (
            <div key={g.label} className="text-center p-4 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
              <div className="text-sm font-bold text-[#1A1410] mb-0.5">{g.label}</div>
              <div className="text-xs text-[#6B5A4A]">{g.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
