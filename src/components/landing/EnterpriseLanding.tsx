import Link from 'next/link'
import { ArrowRight, Check, Users, BarChart2, Zap, Shield, Globe, Landmark, Target, Briefcase, Search, Rss, Lock, HeartHandshake, Clock, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KZ, SUBSCRIPTION_PLANS, PARTNERS, MULTIDIFFUSION_ENABLED, planFeatures } from '@/lib/constants'
import { PartnerCarousel } from './PartnerCarousel'

const PARTNER_ICON_MAP: Record<string, React.ReactNode> = {
  Landmark:  <Landmark  size={16} />,
  Target:    <Target    size={16} />,
  Briefcase: <Briefcase size={16} />,
  Search:    <Search    size={16} />,
  Rss:       <Rss       size={16} />,
}

interface EnterpriseLandingProps {
  stats: { jobs: number; companies: number; users: number }
}

function PriceCard({ plan, isHighlight }: { plan: typeof SUBSCRIPTION_PLANS[0]; isHighlight?: boolean }) {
  const euros = Math.floor(plan.priceCts / 100)
  return (
    <div
      className="kz-card p-6 flex flex-col relative"
      style={{
        background: isHighlight ? KZ.violet : 'white',
        color: isHighlight ? 'white' : KZ.ink,
        boxShadow: isHighlight ? '6px 6px 0 #1A1410' : '3px 3px 0 #1A1410',
        transform: isHighlight ? 'scale(1.03)' : 'none',
      }}
    >
      {isHighlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <Badge color="orange" size="md">⭐ Le plus populaire</Badge>
        </div>
      )}
      <div className="text-sm font-bold mb-1 opacity-70">{plan.name}</div>
      <div className="text-[42px] font-extrabold tracking-tight leading-none mb-1">
        {euros}€
        <span className="text-base font-semibold opacity-60">/mois</span>
      </div>
      <div className="text-xs opacity-60 mb-4">30 jours d&apos;essai · 1er débit après l&apos;essai</div>

      <div className="flex flex-col gap-2 mb-6 flex-1">
        {planFeatures(plan).map(f => (
          <div key={f} className="flex items-start gap-2 text-sm">
            <Check size={14} className="mt-0.5 shrink-0" style={{ color: isHighlight ? KZ.orange : KZ.green }} />
            <span style={{ opacity: isHighlight ? 0.9 : 0.85 }}>{f}</span>
          </div>
        ))}
        {/* Partenaires (multidiffusion — masqué tant que OFF) */}
        {MULTIDIFFUSION_ENABLED && plan.partners.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <div className="text-xs font-bold mb-1.5 opacity-70">Diffusion incluse :</div>
            {plan.partners.map(p => {
              const partner = PARTNERS[p]
              return partner ? (
                <div key={p} className="text-xs flex items-center gap-1.5 mb-1">
                  {PARTNER_ICON_MAP[partner.icon]}
                  <span style={{ opacity: 0.85 }}>{partner.name}</span>
                </div>
              ) : null
            })}
          </div>
        )}
        {plan.apiAccess && (
          <div className="flex items-center gap-2 text-sm">
            <Check size={14} className="shrink-0" style={{ color: KZ.orange }} />
            <span>Accès API complet</span>
          </div>
        )}
      </div>

      <Link href={`/auth/register?role=recruiter&plan=${plan.id}`}>
        <Button
          kind={isHighlight ? 'primary' : 'outline'}
          size="lg"
          full
          iconRight={<ArrowRight size={14} />}
        >
          Essai gratuit 30 jours
        </Button>
      </Link>
    </div>
  )
}

export function EnterpriseLanding({ stats }: EnterpriseLandingProps) {
  const VALUE_PROPS = [
    { icon: <Users size={24} />, color: KZ.violetSoft, title: 'Gestion d\'équipe', desc: 'Plusieurs recruteurs sur un même compte. Rôles, permissions, KazaScore collectif.' },
    ...(MULTIDIFFUSION_ENABLED ? [{ icon: <Globe size={24} />, color: KZ.blueSoft, title: 'Multi-diffusion', desc: 'Publiez une fois, diffusez partout : France Travail, Mission Locale, APEC, Indeed et plus.' }] : []),
    { icon: <Zap size={24} />, color: KZ.yellowSoft, title: 'IA de tri', desc: 'KazaIA analyse chaque candidature. Matching automatique. Zéro CV non pertinent.' },
    { icon: <BarChart2 size={24} />, color: KZ.greenSoft, title: 'Analytics RH', desc: 'Pipeline Kanban, taux de conversion, temps de réponse, KazaScore recruteur.' },
    { icon: <Shield size={24} />, color: KZ.orangeSoft, title: 'Conformité RGPD', desc: 'Données hébergées en France. Chiffrement E2E. Droit à l\'oubli automatisé.' },
  ]

  return (
    <>
      {/* HERO B2B ─────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 pt-16 pb-12 relative overflow-hidden" style={{ background: KZ.ink }}>
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge color="violet" size="lg" className="mb-5">Solution Entreprise · 974</Badge>
            <h1 className="text-[44px] sm:text-[56px] lg:text-[68px] font-extrabold tracking-[-0.04em] leading-[0.92] mb-6"
              style={{ color: KZ.cream }}>
              Recrutez les<br />
              <span style={{ color: KZ.orange }}>meilleurs talents</span><br />
              de La Réunion.
            </h1>
            <p className="text-lg leading-relaxed mb-8 max-w-[500px]" style={{ color: 'rgba(255,247,238,0.75)' }}>
              La plateforme RH faite pour les entreprises réunionnaises. IA de tri des candidatures, équipe multi-recruteurs, analytics RH complet.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/register?role=recruiter">
                <Button kind="primary" size="lg" iconRight={<ArrowRight size={15} />}>
                  Essai gratuit 30 jours
                </Button>
              </Link>
              <a href="#tarifs-pro">
                <Button kind="outline" size="lg" className=" !border-[#FFF7EE]/40">
                  Voir les tarifs
                </Button>
              </a>
            </div>
            <p className="text-xs mt-4" style={{ color: 'rgba(255,247,238,0.4)' }}>
              Carte requise · Annulable à tout moment · RGPD conforme
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: stats.companies || '—', l: 'Entreprises inscrites', color: KZ.violetSoft },
              { v: stats.users || '—',     l: 'Candidats inscrits', color: KZ.orangeSoft },
              { v: stats.jobs || '—',      l: 'Offres publiées', color: KZ.greenSoft },
              { v: '974',                  l: '100% La Réunion', color: KZ.yellowSoft },
            ].map(c => (
              <div key={c.l} className="p-4 rounded-2xl border border-white/10 text-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="text-3xl font-extrabold mb-1" style={{ color: c.color }}>{c.v}</div>
                <div className="text-xs font-semibold opacity-60" style={{ color: KZ.cream }}>{c.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTENAIRES (multidiffusion — masqué tant que OFF) ───── */}
      {MULTIDIFFUSION_ENABLED && (
        <section className="px-4 sm:px-8 lg:px-16 py-10 border-b border-[#1A1410]" style={{ background: KZ.cream2 }}>
          <p className="text-center text-xs font-bold text-[#6B5A4A] uppercase tracking-widest mb-6">
            Multi-diffusion automatique vers
          </p>
          <div className="max-w-[1100px] mx-auto">
            <PartnerCarousel />
          </div>
        </section>
      )}

      {/* VALEUR AJOUTÉE ─────────────────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-20" style={{ background: KZ.cream }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12">
            <p className="kz-eyebrow mb-2" style={{ color: KZ.violet }}>Pourquoi Kazajob Pro</p>
            <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-[#1A1410]">
              Une plateforme RH pensée pour La Réunion.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUE_PROPS.map(p => (
              <div key={p.title} className="kz-card p-6 bg-white">
                <div className="w-12 h-12 rounded-xl border border-[#1A1410] flex items-center justify-center mb-4 text-[#1A1410]"
                  style={{ background: p.color }}>
                  {p.icon}
                </div>
                <h3 className="text-base font-bold text-[#1A1410] mb-2">{p.title}</h3>
                <p className="text-sm text-[#6B5A4A] leading-relaxed">{p.desc}</p>
              </div>
            ))}
            {/* Carte CTA */}
            <div className="kz-card p-6 flex flex-col justify-between" style={{ background: KZ.violet }}>
              <div>
                <Badge color="orange" size="md" className="mb-4">Nouveau</Badge>
                <h3 className="text-base font-bold text-white mb-2">Groupe recruteurs</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  Invitez votre équipe RH. Chaque recruteur a son tableau de bord, les offres sont partagées.
                </p>
              </div>
              <Link href="/auth/register?role=recruiter" className="mt-4">
                <Button kind="primary" size="md" full>Créer mon compte entreprise</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE — recruteur ─────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-20 border-t border-[#1A1410]" style={{ background: KZ.cream2 }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12">
            <p className="kz-eyebrow mb-2" style={{ color: KZ.violet }}>Processus de recrutement</p>
            <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-[#1A1410]">
              Recruter sur Kazajob, c&apos;est simple.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: '1', color: KZ.violetSoft, icon: <Briefcase size={26} />, title: 'Créez votre compte', desc: 'Inscription en 3 minutes. Configurez votre entreprise, logo, secteur, équipe RH.' },
              { n: '2', color: KZ.yellowSoft, icon: <FileText size={26} />, title: 'Publiez votre offre', desc: 'Formulaire guidé, mention H/F vérifiée, questions de préqualification, fourchette salariale.' },
              { n: '3', color: KZ.greenSoft, icon: <Users size={26} />, title: 'Recevez les candidatures', desc: 'KazaIA trie et classe les dossiers. Pipeline Kanban intégré. Messagerie directe avec les candidats.' },
              { n: '4', color: KZ.orangeSoft, icon: <HeartHandshake size={26} />, title: 'Recrutez & mesurez', desc: 'Suivi du temps de réponse (KazaScore), analytics de conversion, historique complet.' },
            ].map((step) => (
              <div key={step.n} className="kz-card p-6 relative pt-10 bg-white">
                <div className="absolute -top-5 left-6 w-11 h-11 rounded-full flex items-center justify-center text-lg font-extrabold border border-[#1A1410]"
                  style={{ background: KZ.ink, color: KZ.cream, boxShadow: '3px 3px 0 #FF6B35' }}>
                  {step.n}
                </div>
                <div className="w-12 h-12 rounded-xl border border-[#1A1410] flex items-center justify-center mb-4 text-[#1A1410]"
                  style={{ background: step.color }}>
                  {step.icon}
                </div>
                <h3 className="text-base font-bold text-[#1A1410] mb-2">{step.title}</h3>
                <p className="text-sm text-[#6B5A4A] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GARANTIES ──────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-14 lg:py-16 border-t border-[#1A1410]" style={{ background: KZ.ink }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-10">
            <p className="kz-eyebrow mb-2" style={{ color: KZ.orange }}>Nos engagements</p>
            <h2 className="text-2xl lg:text-[32px] font-extrabold tracking-tight" style={{ color: KZ.cream }}>
              Ce que Kazajob garantit à chaque recruteur.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Lock size={22} />, color: KZ.violetSoft, title: 'RGPD & Données sécurisées', desc: 'Hébergement européen (Neon/Vercel EU). Chiffrement en transit et au repos. Droit à l\'oubli sur simple demande. Aucune revente de données candidates.' },
              { icon: <Clock size={22} />, color: KZ.greenSoft, title: 'Disponibilité 99,9 %', desc: 'Infrastructure serverless Vercel. Pas de maintenance programmée. Monitoring temps réel. Vos offres restent en ligne même en pic d\'activité.' },
              { icon: <HeartHandshake size={22} />, color: KZ.yellowSoft, title: 'Support local réactif', desc: 'Une équipe réunionnaise disponible du lundi au vendredi. Réponse garantie sous 24h. Accompagnement à l\'onboarding inclus dans tous les plans.' },
              { icon: <BarChart2 size={22} />, color: KZ.orangeSoft, title: 'Transparence des données', desc: 'Statistiques réelles affichées : vues, candidatures, taux d\'ouverture. Aucune donnée gonflée. Vos performances, telles qu\'elles sont.' },
              { icon: <Shield size={22} />, color: KZ.blueSoft, title: 'Conformité légale 974', desc: 'Mention H/F vérifiée à la publication. Aide à la rédaction d\'offres conformes au Code du Travail. Archivage légal des candidatures pendant 2 ans.' },
              { icon: <Users size={22} />, color: KZ.cream2, title: 'Candidats qualifiés locaux', desc: 'Plateforme 100% tournée vers La Réunion et Mayotte. Chaque candidat inscrit est un habitant local. Matching géographique inclus d\'office.' },
            ].map((g) => (
              <div key={g.title} className="flex gap-4 p-5 rounded-2xl border border-white/10"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center shrink-0"
                  style={{ background: g.color, color: KZ.ink }}>
                  {g.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1" style={{ color: KZ.cream }}>{g.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,247,238,0.6)' }}>{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ RECRUTEUR ──────────────────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-14 lg:py-16 border-t border-[#1A1410]" style={{ background: KZ.cream }}>
        <div className="max-w-[860px] mx-auto">
          <div className="text-center mb-10">
            <p className="kz-eyebrow mb-2" style={{ color: KZ.violet }}>Questions fréquentes</p>
            <h2 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">
              Vous avez des questions. On a les réponses.
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { q: 'Puis-je annuler à tout moment ?', a: 'Oui. L\'annulation est effective immédiatement depuis votre espace recruteur. Aucun frais de résiliation, aucun engagement. Le prochain débit est simplement annulé.' },
              { q: 'Combien de recruteurs peuvent utiliser le même compte ?', a: 'Cela dépend de votre plan. Le plan Starter inclut 1 recruteur, Pro 3, Studio 5 et Agency est illimité. Vous pouvez inviter des membres depuis Paramètres > Équipe.' },
              { q: 'Mes offres sont-elles visibles immédiatement après publication ?', a: 'Oui, dès la validation du formulaire votre offre est en ligne. Les candidats la voient en temps réel. Les offres boostées apparaissent en tête de liste pendant la durée du boost.' },
              { q: 'Que se passe-t-il à la fin des 30 jours d\'essai ?', a: 'Votre carte est débitée automatiquement du montant du plan choisi. Vous recevez un email de rappel 3 jours avant. Si vous annulez avant la fin de l\'essai, aucun débit n\'est effectué.' },
              { q: 'Les données de mes candidats sont-elles sécurisées ?', a: 'Absolument. Les données sont hébergées en Europe, chiffrées en transit (HTTPS/TLS) et au repos. Kazajob est conforme RGPD. Les candidats peuvent exercer leur droit à l\'effacement à tout moment.' },
              { q: 'Puis-je créer des offres pour une autre entreprise (cabinet RH) ?', a: 'Oui. Le plan Agency est conçu pour les cabinets de recrutement. Vous gérez plusieurs entreprises clientes depuis un seul tableau de bord, avec des offres anonymisées si besoin.' },
            ].map((item) => (
              <div key={item.q} className="kz-card p-5 bg-white">
                <h3 className="text-sm font-bold text-[#1A1410] mb-2">{item.q}</h3>
                <p className="text-sm text-[#6B5A4A] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-[#6B5A4A]">Une autre question ?{' '}
              <a href="mailto:contact@kazajob.re" className="font-bold text-[#1A1410] hover:underline">contact@kazajob.re</a>
            </p>
          </div>
        </div>
      </section>

      {/* PRICING ─────────────────────────────────────────────── */}
      <section id="tarifs-pro" className="px-4 sm:px-8 lg:px-16 py-16 lg:py-20 border-t border-[#1A1410]"
        style={{ background: KZ.cream2 }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12">
            <p className="kz-eyebrow mb-2" style={{ color: KZ.violet }}>Tarifs</p>
            <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-[#1A1410]">
              Un forfait pour chaque taille d&apos;entreprise.
            </h2>
            <p className="text-sm text-[#6B5A4A] mt-2">30 jours d&apos;essai sur tous les plans · Carte requise · 1er débit après l&apos;essai</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
            {SUBSCRIPTION_PLANS.map(plan => (
              <PriceCard key={plan.id} plan={plan} isHighlight={plan.highlight} />
            ))}
          </div>
          <p className="text-center text-xs text-[#6B5A4A] mt-6">
            Tarifs nets · TVA non applicable, art. 293 B du CGI (micro-entreprise) · Paiement mensuel
          </p>
        </div>
      </section>

      {/* CTA FINAL ───────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-16 text-center border-t border-[#1A1410]"
        style={{ background: KZ.ink }}>
        <h2 className="text-[36px] lg:text-[52px] font-extrabold tracking-tight leading-none mb-4"
          style={{ color: KZ.cream }}>
          Prêt à recruter<br />
          <span style={{ color: KZ.orange }}>différemment ?</span>
        </h2>
        <p className="text-base opacity-70 mb-8 max-w-[500px] mx-auto" style={{ color: KZ.cream }}>
          Rejoignez les entreprises réunionnaises qui font confiance à Kazajob pour leurs recrutements.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/register?role=recruiter">
            <Button kind="primary" size="lg" iconRight={<ArrowRight size={15} />}>
              Démarrer l&apos;essai gratuit
            </Button>
          </Link>
          <Link href="/recruiter/company-setup">
            <Button kind="outline" size="lg" className=" !border-[#FFF7EE]/40">
              Configurer mon entreprise
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}
