import Link from 'next/link'
import { Sparkles, ArrowRight, FileText, Brain, User, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KZ } from '@/lib/constants'

const IA_FEATURES = [
  {
    icon: <FileText size={20} />,
    title: 'Lettre de motivation en 5 sec',
    desc: 'KazaIA analyse ton profil + l\'offre et rédige une lettre personnalisée, professionnelle, en français parfait.',
    badge: 'Disponible',
    badgeColor: KZ.green,
  },
  {
    icon: <Brain size={20} />,
    title: 'Préparation entretien IA',
    desc: '8 questions d\'entretien personnalisées pour chaque poste : comportementales, techniques, motivation.',
    badge: 'Disponible',
    badgeColor: KZ.green,
  },
  {
    icon: <User size={20} />,
    title: 'CV Builder intelligent',
    desc: 'Crée ton CV visuel depuis ton profil en 2 minutes. 3 templates, couleurs libres, export PDF.',
    badge: 'Disponible',
    badgeColor: KZ.green,
  },
  {
    icon: <Zap size={20} />,
    title: 'Analyse CV & onboarding',
    desc: 'Upload ton CV existant, KazaIA extrait tes compétences et complète ton profil automatiquement.',
    badge: 'Bientôt',
    badgeColor: KZ.orange,
  },
]

export function KazaIASpotlight() {
  return (
    <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-24 relative overflow-hidden" style={{ background: KZ.cream2 }}>
      {/* Décor */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #6D3BEB 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />

      <div className="max-w-[1280px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Texte gauche */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-11 h-11 rounded-xl border border-[#1A1410] flex items-center justify-center"
                style={{ background: KZ.violet, boxShadow: '3px 3px 0 #1A1410' }}
              >
                <Sparkles size={22} color="white" />
              </div>
              <Badge color="violet" size="lg">KazaIA — Intelligence artificielle</Badge>
            </div>

            <h2 className="text-3xl lg:text-[42px] font-extrabold tracking-tight text-[#1A1410] mb-4">
              L&apos;IA qui travaille<br />
              <span style={{ color: KZ.violet }}>à ta place.</span>
            </h2>

            <p className="text-base text-[#2A2018] leading-relaxed mb-6 max-w-[480px]">
              KazaIA est intégré directement dans Kazajob. Pas besoin de ChatGPT, pas besoin de copier-coller.
              L&apos;IA connaît ton profil et chaque offre pour te donner des réponses vraiment personnalisées.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {['Gratuit pour les candidats', 'Groq · Llama 3.3 (bientôt Claude)', 'Données confidentielles'].map(tag => (
                <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border border-[#1A1410]" style={{ background: KZ.cream }}>
                  {tag}
                </span>
              ))}
            </div>

            <Link href="/auth/register">
              <Button kind="violet" size="lg" iconRight={<ArrowRight size={16} />}>
                Essayer KazaIA gratuitement
              </Button>
            </Link>
          </div>

          {/* Cards features droite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {IA_FEATURES.map((f) => (
              <div
                key={f.title}
                className="kz-card p-5 flex flex-col gap-3"
                style={{ background: KZ.paper }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-xl border border-[#1A1410] flex items-center justify-center text-[#1A1410]"
                    style={{ background: KZ.violetSoft }}
                  >
                    {f.icon}
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#1A1410]"
                    style={{ background: f.badgeColor + '30', color: f.badgeColor }}
                  >
                    {f.badge}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1A1410] mb-1">{f.title}</div>
                  <div className="text-xs text-[#6B5A4A] leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
