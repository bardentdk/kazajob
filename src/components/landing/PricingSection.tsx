'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Zap, Crown, Building2, Star, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KZ } from '@/lib/constants'

const CANDIDATE_FEATURES = [
  'Accès à toutes les offres La Réunion',
  'Candidature 1 clic',
  'Matching IA personnalisé',
  'KazaIA — Lettres de motivation',
  'KazaIA — Préparation entretien',
  'CV Builder visuel inclus',
  'Messagerie avec recruteurs',
  'Alertes offres en temps réel',
  'Gamification & badges',
  'Profil candidat complet',
]

interface Plan {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  accentColor: string
  monthlyPrice: number
  annualPrice: number
  description: string
  badge?: string
  badgeColor?: 'orange' | 'violet' | 'yellow'
  cta: string
  href: string
  features: { label: string; included: boolean; highlight?: boolean }[]
  limit?: string
  soon?: string[]
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    icon: <Zap size={20} />,
    color: KZ.cream2,
    accentColor: KZ.ink,
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Pour tester Kazajob et publier vos premières offres.',
    cta: 'Commencer gratuitement',
    href: '/auth/register?role=recruiter',
    limit: '2 offres actives max',
    features: [
      { label: '2 offres actives simultanées', included: true },
      { label: 'Pipeline recrutement basique', included: true },
      { label: 'Messagerie candidats', included: true },
      { label: 'Statistiques de base', included: true },
      { label: 'Offres illimitées', included: false },
      { label: 'KazaIA recruteur', included: false },
      { label: 'Boost offres', included: false },
      { label: 'Export candidats CSV', included: false },
      { label: 'Accès candidats proactifs', included: false },
      { label: 'Support prioritaire', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: <Star size={20} />,
    color: KZ.violetSoft,
    accentColor: KZ.violet,
    monthlyPrice: 29,
    annualPrice: 23,
    description: 'Pour les entreprises qui recrutent régulièrement en 974.',
    badge: 'Le plus populaire',
    badgeColor: 'violet',
    cta: 'Commencer en Pro',
    href: '/auth/register?role=recruiter&plan=pro',
    features: [
      { label: 'Offres illimitées', included: true, highlight: true },
      { label: 'Pipeline Kanban avancé', included: true, highlight: true },
      { label: 'Messagerie candidats', included: true },
      { label: 'Statistiques & analytics', included: true },
      { label: 'Boost 1 offre/mois inclus', included: true, highlight: true },
      { label: 'Export candidats CSV', included: true },
      { label: 'KazaIA tri automatique', included: true, highlight: true },
      { label: 'Accès candidats proactifs', included: false },
      { label: 'API recruteur', included: false },
      { label: 'Support prioritaire', included: false },
    ],
  },
  {
    id: 'max',
    name: 'Max',
    icon: <Crown size={20} />,
    color: '#FFF1C2',
    accentColor: '#B8860B',
    monthlyPrice: 79,
    annualPrice: 63,
    description: 'Pour les RH et cabinets de recrutement de La Réunion.',
    badge: 'Tout inclus',
    badgeColor: 'yellow',
    cta: 'Passer en Max',
    href: '/auth/register?role=recruiter&plan=max',
    features: [
      { label: 'Offres illimitées', included: true, highlight: true },
      { label: 'Pipeline Kanban avancé', included: true },
      { label: 'Messagerie candidats', included: true },
      { label: 'Analytics avancés + exports', included: true },
      { label: 'Boost 5 offres/mois inclus', included: true, highlight: true },
      { label: 'Export candidats CSV', included: true },
      { label: 'KazaIA — Sourcing automatique', included: true, highlight: true },
      { label: 'Accès candidats proactifs', included: true, highlight: true },
      { label: 'API recruteur', included: true, highlight: true },
      { label: 'Support prioritaire dédié', included: true, highlight: true },
    ],
    soon: ['Job Dating numérique', 'Évaluation de compétences IA', 'Salary Insights 974'],
  },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="tarifs" className="px-4 sm:px-8 lg:px-16 py-16 lg:py-24" style={{ background: KZ.cream }}>
      <div className="max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="kz-eyebrow mb-3" style={{ color: KZ.orange }}>Tarifs recruteurs</p>
          <h2 className="text-3xl lg:text-[44px] font-extrabold tracking-tight text-[#1A1410] mb-4">
            Transparent, local,<br />
            <span style={{ color: KZ.orange }}>sans mauvaise surprise.</span>
          </h2>
          <p className="text-base text-[#6B5A4A] max-w-[520px] mx-auto mb-8">
            Les candidats accèdent à <strong className="text-[#1A1410]">100% des fonctionnalités gratuitement</strong>, pour toujours.
            Les recruteurs choisissent leur plan selon leurs besoins.
          </p>

          {/* Toggle annuel/mensuel */}
          <div className="inline-flex items-center gap-3 p-1 rounded-xl border border-[#1A1410]" style={{ background: KZ.paper, boxShadow: '3px 3px 0 #1A1410' }}>
            <button
              onClick={() => setAnnual(false)}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={!annual
                ? { background: KZ.ink, color: KZ.cream, boxShadow: '2px 2px 0 #FF6B35' }
                : { color: KZ.mute }}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
              style={annual
                ? { background: KZ.ink, color: KZ.cream, boxShadow: '2px 2px 0 #FF6B35' }
                : { color: KZ.mute }}
            >
              Annuel
              <Badge color="green" size="sm">-20%</Badge>
            </button>
          </div>
        </div>

        {/* Grille plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {PLANS.map((plan) => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice
            const isPro = plan.id === 'pro'

            return (
              <div
                key={plan.id}
                className="flex flex-col rounded-2xl border-[1.5px] border-[#1A1410] overflow-hidden transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
                style={{
                  background: plan.color,
                  boxShadow: isPro ? `5px 5px 0 ${plan.accentColor}` : '4px 4px 0 #1A1410',
                  transform: isPro ? 'scale(1.02)' : undefined,
                }}
              >
                {/* Header plan */}
                <div className="p-6 border-b border-[#1A1410]/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl border border-[#1A1410] flex items-center justify-center"
                        style={{ background: plan.accentColor, color: plan.accentColor === KZ.ink ? KZ.cream : 'white' }}
                      >
                        {plan.icon}
                      </div>
                      <span className="text-lg font-extrabold text-[#1A1410]">{plan.name}</span>
                    </div>
                    {plan.badge && (
                      <Badge color={plan.badgeColor ?? 'orange'} size="sm">{plan.badge}</Badge>
                    )}
                  </div>

                  <div className="mb-2">
                    <span className="text-[42px] font-extrabold tracking-tight text-[#1A1410] leading-none">
                      {price === 0 ? 'Gratuit' : `${price}€`}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-[#6B5A4A] ml-1">/mois {annual && <span className="text-xs">(facturé annuellement)</span>}</span>
                    )}
                  </div>
                  {plan.limit && (
                    <p className="text-xs font-semibold text-[#6B5A4A]">{plan.limit}</p>
                  )}
                  <p className="text-sm text-[#6B5A4A] mt-2">{plan.description}</p>
                </div>

                {/* Features */}
                <div className="p-6 flex-1">
                  <ul className="flex flex-col gap-2.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        {f.included ? (
                          <div
                            className="w-5 h-5 rounded-full border border-[#1A1410] flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: f.highlight ? plan.accentColor : KZ.greenSoft }}
                          >
                            <Check size={11} color={f.highlight && plan.accentColor !== '#B8860B' ? 'white' : KZ.ink} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-[#E8DDC9] bg-[#F5F5F5] flex items-center justify-center shrink-0 mt-0.5">
                            <X size={10} color="#CCC" />
                          </div>
                        )}
                        <span className={`text-sm ${f.included ? f.highlight ? 'font-bold text-[#1A1410]' : 'text-[#2A2018]' : 'text-[#9B9B9B] line-through'}`}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Soon features */}
                  {plan.soon && plan.soon.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#E8DDC9]">
                      <div className="kz-eyebrow text-[#6B5A4A] mb-2">Bientôt inclus</div>
                      {plan.soon.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1.5">
                          <Sparkles size={12} style={{ color: plan.accentColor }} />
                          <span className="text-xs font-semibold text-[#6B5A4A]">{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="p-6 pt-0">
                  <Link href={plan.href}>
                    <Button
                      kind={isPro ? 'violet' : 'outline'}
                      size="lg"
                      full
                      iconRight={<ArrowRight size={15} />}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Plan candidat — toujours gratuit */}
        <div
          className="rounded-2xl border border-[#1A1410] overflow-hidden"
          style={{ background: KZ.ink, boxShadow: '5px 5px 0 #FF6B35' }}
        >
          {/* Ligne du haut : titre + CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-white/20 bg-[#FF6B35] flex items-center justify-center shrink-0">
                <Building2 size={18} color="white" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-white leading-tight">
                  Candidat &mdash;{' '}
                  <span style={{ color: KZ.orange }}>100% gratuit, pour toujours</span>
                </div>
                <div className="text-xs text-white/60 mt-0.5">
                  Kazajob ne facturera jamais les candidats.
                </div>
              </div>
            </div>
            <Link href="/auth/register" className="shrink-0">
              <Button kind="primary" size="md">Créer mon compte gratuit</Button>
            </Link>
          </div>

          {/* Grille de features */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 divide-x divide-y divide-white/10">
            {CANDIDATE_FEATURES.slice(0, 5).map((f) => (
              <div key={f} className="flex items-center gap-2 px-4 py-3">
                <Check size={13} color="#19A974" className="shrink-0" />
                <span className="text-xs font-semibold text-white/75 leading-tight">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Garanties */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Sans engagement', desc: 'Annulation à tout moment' },
            { label: 'Données en France', desc: 'RGPD conforme · Hébergement EU' },
            { label: 'Essai 14 jours', desc: 'Carte bancaire non requise' },
            { label: 'Support 974', desc: 'Équipe locale, réponse <24h' },
          ].map(g => (
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
