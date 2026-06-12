import { Check, Clock, Rocket } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { KZ } from '@/lib/constants'

const ROADMAP = [
  {
    quarter: 'Disponible maintenant',
    status: 'done',
    items: [
      'KazaIA — Lettre de motivation & préparation entretien',
      'CV Builder + export PDF, ou upload de CV',
      'Matching IA avec score de correspondance',
      'Onboarding gamifié + quiz de personnalité',
      'Messagerie candidat ↔ recruteur + notifications',
      'KazaScore, pitch vidéo & KazaBoost',
      'Espace recruteur multi-entreprises (rôles, invitations, transfert)',
      'Paiement & abonnement en ligne (Stripe, essai 30 jours)',
      'Analytics recruteur (vues, pipeline, conversion)',
      'KazaEvents, formations & parrainage',
    ],
  },
  {
    quarter: 'Q3 2026 — Dans 3 mois',
    status: 'soon',
    items: [
      'Multi-diffusion France Travail',
      'Alertes emploi push (application installable / PWA)',
      'KazaReviews — avis employeurs vérifiés',
      'Matching détaillé & conseils d\'amélioration',
      'CVthèque — recherche de candidats pour recruteurs',
      'Tableau analytics enrichi (sources, conversion)',
    ],
  },
  {
    quarter: 'Q4 2026 — Dans 6 mois',
    status: 'planned',
    items: [
      'Annonces boostées (mise en avant payante)',
      'Multi-diffusion APEC, Indeed & flux XML',
      'Accompagnement recrutement & partenariats locaux',
      'Baromètre des salaires 974',
      'API recruteur & intégration ATS',
      'Application mobile native (iOS & Android)',
    ],
  },
]

const STATUS_STYLES = {
  done:    { bg: KZ.greenSoft,  accent: KZ.green,  icon: <Check size={14} />,  label: 'Disponible' },
  soon:    { bg: KZ.violetSoft, accent: KZ.violet,  icon: <Clock size={14} />,  label: 'Bientôt' },
  planned: { bg: KZ.orangeSoft, accent: KZ.orange,  icon: <Rocket size={14} />, label: 'Planifié' },
}

export function RoadmapSection() {
  return (
    <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-24" style={{ background: KZ.cream }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-12">
          <p className="kz-eyebrow mb-3" style={{ color: KZ.green }}>Roadmap</p>
          <h2 className="text-3xl lg:text-[40px] font-extrabold tracking-tight text-[#1A1410] mb-4">
            On construit Kazajob<br />
            <span style={{ color: KZ.green }}>avec vous.</span>
          </h2>
          <p className="text-base text-[#6B5A4A] max-w-[480px] mx-auto">
            Transparence totale sur ce qui est disponible, ce qui arrive bientôt et ce que nous préparons.
            Chaque retour utilisateur influence la priorité.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ROADMAP.map((phase) => {
            const style = STATUS_STYLES[phase.status as keyof typeof STATUS_STYLES]
            return (
              <div
                key={phase.quarter}
                className="kz-card p-6 flex flex-col gap-4"
                style={{ background: style.bg }}
              >
                {/* Header phase */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg border border-[#1A1410] flex items-center justify-center"
                      style={{ background: style.accent, color: 'white' }}
                    >
                      {style.icon}
                    </div>
                    <Badge
                      color={phase.status === 'done' ? 'green' : phase.status === 'soon' ? 'violet' : 'orange'}
                      size="sm"
                    >
                      {style.label}
                    </Badge>
                  </div>
                  <h3 className="text-base font-extrabold text-[#1A1410]">{phase.quarter}</h3>
                </div>

                {/* Items */}
                <ul className="flex flex-col gap-2.5">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full border border-[#1A1410] flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: style.accent }}
                      >
                        {phase.status === 'done'
                          ? <Check size={9} color="white" />
                          : <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        }
                      </div>
                      <span className="text-sm text-[#1A1410] leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Note de transparence */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#6B5A4A]">
            Tu as une idée de feature ?{' '}
            <a href="mailto:kazajob.re@gmail.com" className="font-bold hover:underline" style={{ color: KZ.violet }}>
              kazajob.re@gmail.com
            </a>{' '}
            — chaque suggestion est lue par l&apos;équipe.
          </p>
        </div>
      </div>
    </section>
  )
}
