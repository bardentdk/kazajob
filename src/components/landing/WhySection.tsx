import Link from 'next/link'
import { Sparkles, Target, MessageCircle, Trophy, Clock, Shield } from 'lucide-react'
import { KZ } from '@/lib/constants'

const USP = [
  {
    icon: <Sparkles size={28} />,
    color: KZ.violetSoft,
    accentColor: KZ.violet,
    title: 'KazaIA — Ton assistant emploi',
    desc: 'Génère ta lettre de motivation en 5 secondes, prépare tes entretiens, optimise ton CV. Propulsé par les meilleurs modèles IA du marché.',
    tag: 'Exclusif Kazajob',
  },
  {
    icon: <Target size={28} />,
    color: KZ.orangeSoft,
    accentColor: KZ.orange,
    title: 'Matching IA ultra-précis',
    desc: 'Notre algorithme croise tes compétences, ta localisation et tes préférences avec toutes les offres. Score de correspondance visible sur chaque poste.',
    tag: 'Précision 94%',
  },
  {
    icon: <MessageCircle size={28} />,
    color: KZ.greenSoft,
    accentColor: KZ.green,
    title: 'Messagerie directe temps réel',
    desc: 'Échange directement avec les recruteurs sans intermédiaire. Notifications instant et suivi de tes candidatures en un coup d\'œil.',
    tag: 'Temps réel',
  },
  {
    icon: <Trophy size={28} />,
    color: KZ.yellowSoft,
    accentColor: '#B8860B',
    title: 'Gamification & progression',
    desc: 'XP, streaks, badges, niveaux — chaque action te récompense. Reste motivé dans ta recherche et démarque-toi avec ton profil actif.',
    tag: 'Unique en 974',
  },
  {
    icon: <Clock size={28} />,
    color: KZ.blueSoft,
    accentColor: KZ.blue,
    title: 'Candidature 1 clic',
    desc: 'CV pré-rempli, lettre IA personnalisée, envoi instantané. Postule à 10 offres en moins de 10 minutes. Zéro copier-coller.',
    tag: 'Ultra rapide',
  },
  {
    icon: <Shield size={28} />,
    color: KZ.cream2,
    accentColor: KZ.mute,
    title: 'Local, sécurisé, gratuit',
    desc: 'Données hébergées en Europe, RGPD conforme, équipe réunionnaise. Kazajob ne vend jamais tes données et ne facture jamais les candidats.',
    tag: '100% gratuit candidat',
  },
]

const COMPETITORS = [
  { feature: 'Offres La Réunion', kazajob: true, koann: true, pole: true },
  { feature: 'Matching IA personnalisé', kazajob: true, koann: false, pole: false },
  { feature: 'KazaIA (lettres + entretien)', kazajob: true, koann: false, pole: false },
  { feature: 'CV Builder visuel', kazajob: true, koann: false, pole: false },
  { feature: 'Messagerie directe candidat/recruteur', kazajob: true, koann: false, pole: true },
  { feature: 'Gamification & engagement', kazajob: true, koann: false, pole: false },
  { feature: 'Onboarding gamifié', kazajob: true, koann: false, pole: false },
  { feature: 'Design mobile-first', kazajob: true, koann: false, pole: false },
  { feature: 'Candidature gratuite illimitée', kazajob: true, koann: true, pole: true },
]

export function WhySection() {
  return (
    <>
      {/* USP Grid */}
      <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-24" style={{ background: KZ.cream }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12">
            <p className="kz-eyebrow mb-3" style={{ color: KZ.orange }}>Pourquoi Kazajob</p>
            <h2 className="text-3xl lg:text-[44px] font-extrabold tracking-tight text-[#1A1410] mb-4">
              Pas juste un moteur d&apos;offres.<br />
              <span style={{ color: KZ.orange }}>Un vrai assistant emploi.</span>
            </h2>
            <p className="text-base text-[#6B5A4A] max-w-[540px] mx-auto">
              Kazajob est la seule plateforme d&apos;emploi de La Réunion à combiner IA, gamification et accompagnement
              personnalisé pour chaque candidat.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {USP.map((item) => (
              <div
                key={item.title}
                className="kz-card p-6 flex flex-col gap-4 group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1410] transition-all duration-150"
                style={{ background: item.color }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl border border-[#1A1410] flex items-center justify-center text-[#1A1410]"
                    style={{ background: KZ.paper }}
                  >
                    {item.icon}
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full border border-[#1A1410]"
                    style={{ background: item.accentColor, color: item.accentColor === KZ.mute || item.accentColor === '#B8860B' ? KZ.cream : 'white' }}
                  >
                    {item.tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1A1410] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#2A2018] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparatif */}
      <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-20" style={{ background: KZ.ink }}>
        <div className="max-w-[860px] mx-auto">
          <div className="text-center mb-10">
            <p className="kz-eyebrow mb-3" style={{ color: KZ.orange }}>Comparatif</p>
            <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-white mb-3">
              Kazajob vs les autres plateformes
            </h2>
            <p className="text-sm text-white/60">Le seul outil de recherche d&apos;emploi conçu pour La Réunion de A à Z.</p>
          </div>

          <div className="rounded-2xl border border-white/20 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 px-5 py-3 border-b border-white/10">
              <div className="text-xs font-bold text-white/50 uppercase tracking-wider">Fonctionnalité</div>
              <div className="text-center w-24 text-xs font-bold" style={{ color: KZ.orange }}>Kazajob</div>
              <div className="text-center w-24 text-xs font-bold text-white/50">Sites péi</div>
              <div className="text-center w-24 text-xs font-bold text-white/50">Sites nationaux</div>
            </div>

            {/* Rows */}
            {COMPETITORS.map((row, i) => (
              <div
                key={row.feature}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-0 px-5 py-3.5 border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <div className="text-sm text-white/80">{row.feature}</div>
                <div className="flex justify-center w-24">
                  {row.kazajob
                    ? <div className="w-5 h-5 rounded-full bg-[#19A974] border border-white/20 flex items-center justify-center"><svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg></div>
                    : <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1L8 8M8 1L1 8" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
                  }
                </div>
                <div className="flex justify-center w-24">
                  {row.koann
                    ? <div className="w-5 h-5 rounded-full bg-white/20 border border-white/20 flex items-center justify-center"><svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round"/></svg></div>
                    : <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1L8 8M8 1L1 8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
                  }
                </div>
                <div className="flex justify-center w-24">
                  {row.pole
                    ? <div className="w-5 h-5 rounded-full bg-white/20 border border-white/20 flex items-center justify-center"><svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round"/></svg></div>
                    : <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1L8 8M8 1L1 8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
