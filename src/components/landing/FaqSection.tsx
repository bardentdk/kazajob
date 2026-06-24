'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { KZ } from '@/lib/constants'

const FAQ_ITEMS = [
  {
    q: 'Kazajob est-il vraiment gratuit pour les candidats ?',
    a: 'Oui, à 100%. Toutes les fonctionnalités candidat — offres illimitées, KazaIA, CV Builder, messagerie, gamification — sont gratuites et le resteront. Kazajob ne facturera jamais les candidats. Notre modèle économique repose uniquement sur les abonnements recruteurs.',
  },
  {
    q: 'Comment fonctionne le matching IA ?',
    a: 'Notre algorithme analyse ton profil (compétences, localisation, secteur, expériences) et le compare aux offres disponibles. Tu reçois un score de correspondance de 0 à 100% pour chaque offre. Plus ton profil est complet, plus le matching est précis. KazaIA peut aussi analyser ton CV pour extraire automatiquement tes compétences.',
  },
  {
    q: 'Quelles sont les offres disponibles sur Kazajob ?',
    a: 'Kazajob se concentre sur l\'emploi à La Réunion (974). Toutes les offres sont publiées par des recruteurs locaux vérifiés. Tu trouveras des CDI, CDD, stages, alternances et missions freelance dans tous les secteurs — du BTP à la tech en passant par le tourisme, la santé et le commerce.',
  },
  {
    q: 'Comment KazaIA génère-t-il les lettres de motivation ?',
    a: 'KazaIA analyse ton profil complet (compétences, bio, expériences) et les détails de l\'offre pour rédiger une lettre personnalisée et professionnelle. Tu peux choisir le ton — professionnel, original ou concis — et modifier le résultat à ta convenance avant de l\'envoyer. Propulsé par Groq (Llama 3.3) aujourd\'hui, Claude demain.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Oui. Kazajob s\'appuie sur une infrastructure PostgreSQL hébergée en Europe, avec chiffrement des données au repos et en transit. Ton CV est stocké dans un espace privé sécurisé. Nous sommes RGPD conformes et ne revendons jamais tes données. Tu peux demander la suppression de ton compte à tout moment.',
  },
  {
    q: 'Qu\'est-ce que l\'offre KazaLaunch ?',
    a: 'KazaLaunch est notre offre d\'inauguration : 3 mois gratuits pour publier vos premières offres, sans carte bancaire et sans aucun prélèvement automatique. Elle inclut 1 recruteur et jusqu\'à 3 offres actives. À la fin des 3 mois, vous choisissez un forfait payant pour continuer à publier — vos candidatures et vos données restent accessibles. L\'offre est utilisable une seule fois par entreprise et sa disponibilité pour les nouvelles inscriptions peut être suspendue à tout moment.',
  },
  {
    q: 'En tant que recruteur, puis-je tester avant de payer ?',
    a: 'Oui, de deux façons. Avec KazaLaunch, vous publiez gratuitement pendant 3 mois sans carte bancaire (offre de lancement). Sinon, tous les forfaits payants incluent un essai de 30 jours : vous enregistrez votre carte à l\'activation (paiement sécurisé Stripe), mais aucun débit n\'a lieu pendant l\'essai — le 1er prélèvement intervient à la fin des 30 jours, sauf résiliation avant. Sans engagement, annulable à tout moment.',
  },
  {
    q: 'Quelle est la différence avec les autres sites d\'emploi ?',
    a: 'Kazajob est la seule plateforme locale à combiner : matching IA personnalisé, KazaIA pour la rédaction et la préparation, CV Builder visuel, gamification, et une expérience mobile-first. Là où les autres affichent des offres, Kazajob t\'accompagne tout au long de ta recherche.',
  },
  {
    q: 'À quoi ressemble la roadmap de Kazajob ?',
    a: 'Dans les 3 prochains mois : analytics recruteur avancés, CVthèque et alertes push. D\'ici 6 mois : accompagnement recrutement & partenariats locaux, baromètre des salaires 974, intégration ATS et application mobile native.',
  },
]

// Données structurées FAQPage → éligibilité rich snippets Google
const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <section id="faq" className="px-4 sm:px-8 lg:px-16 py-16 lg:py-24" style={{ background: KZ.cream2 }}>
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-12">
          <p className="kz-eyebrow mb-3" style={{ color: KZ.violet }}>FAQ</p>
          <h2 className="text-3xl lg:text-[40px] font-extrabold tracking-tight text-[#1A1410]">
            Les questions qu&apos;on nous pose<br />
            <span style={{ color: KZ.violet }}>le plus souvent.</span>
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#1A1410] overflow-hidden transition-all"
              style={{
                background: open === i ? KZ.paper : KZ.cream,
                boxShadow: open === i ? '4px 4px 0 #1A1410' : '2px 2px 0 #E8DDC9',
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#FBEFE0] transition-colors"
              >
                <span className="text-sm font-bold text-[#1A1410] pr-4">{item.q}</span>
                {open === i
                  ? <ChevronUp size={18} className="text-[#6B5A4A] shrink-0" />
                  : <ChevronDown size={18} className="text-[#6B5A4A] shrink-0" />
                }
              </button>
              {open === i && (
                <div className="px-5 pb-5 pt-0">
                  <div className="h-px bg-[#E8DDC9] mb-4" />
                  <p className="text-sm text-[#2A2018] leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-[#6B5A4A] mt-8">
          Tu as une autre question ?{' '}
          <a href="mailto:hello@kazajob.re" className="font-bold hover:text-[#FF6B35] transition-colors" style={{ color: KZ.orange }}>
            Écris-nous — hello@kazajob.re
          </a>
        </p>
      </div>
      </section>
    </>
  )
}
