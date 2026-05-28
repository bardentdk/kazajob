import { KZ } from '@/lib/constants'

const TESTIMONIALS = [
  {
    color: KZ.orangeSoft,
    borderColor: KZ.orange,
    name: 'Marie H.',
    role: 'Développeuse Full-Stack',
    company: 'Run Tech · Saint-Denis',
    avatar: 'MH',
    avatarBg: KZ.orange,
    stars: 5,
    body: "J'ai trouvé en 5 jours alors que je cherchais depuis 4 mois. Le matching IA m'a évité de postuler à des offres qui ne me correspondaient pas. La lettre de motivation générée par KazaIA était meilleure que ce que j'aurais écrit moi-même.",
    tag: 'CDI décroché',
    tagColor: KZ.green,
  },
  {
    color: KZ.violetSoft,
    borderColor: KZ.violet,
    name: 'Jean-Luc P.',
    role: 'Comptable senior',
    company: 'Bourbon Co · Le Tampon',
    avatar: 'JP',
    avatarBg: KZ.violet,
    stars: 5,
    body: "Premier entretien 48h après mon inscription. L'application est belle, rapide, et elle est faite pour nous — les candidats réunionnais. Le CV Builder m'a permis de créer un CV professionnel sans designer.",
    tag: 'Embauché en 2 semaines',
    tagColor: KZ.green,
  },
  {
    color: KZ.greenSoft,
    borderColor: KZ.green,
    name: 'Aïcha M.',
    role: 'UX/UI Designer',
    company: 'Île Digital · Saint-Paul',
    avatar: 'AM',
    avatarBg: KZ.green,
    stars: 5,
    body: "Le score de matching me dit exactement où je suis légitime à postuler. Plus de doutes, plus de refus. Et la préparation d'entretien IA m'a donné confiance — les questions étaient exactement celles posées le jour J.",
    tag: 'Score matching 94%',
    tagColor: KZ.violet,
  },
  {
    color: KZ.yellowSoft,
    borderColor: '#B8860B',
    name: 'Sébastien L.',
    role: 'DRH · Cilaos Group',
    company: 'Cilaos · 12 recrutements/an',
    avatar: 'SL',
    avatarBg: '#B8860B',
    stars: 5,
    body: "En tant que recruteur, Kazajob a changé notre façon de travailler. Le pipeline Kanban, le score IA sur les candidatures, la messagerie directe — on a réduit nos délais de recrutement de 3 semaines à 9 jours.",
    tag: 'Recruteur Pro',
    tagColor: KZ.violet,
  },
]

export function TestimonialsSection() {
  return (
    <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-24" style={{ background: KZ.cream2 }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-12">
          <p className="kz-eyebrow mb-3" style={{ color: KZ.violet }}>Témoignages</p>
          <h2 className="text-3xl lg:text-[40px] font-extrabold tracking-tight text-[#1A1410]">
            Lé là, lé bon —<br />
            <span style={{ color: KZ.violet }}>la preuve en chiffres.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-8 mt-8">
            {[
              { v: '94%', l: 'satisfaction candidats' },
              { v: '9 jours', l: 'délai moyen recrutement' },
              { v: '4.8/5', l: 'note application' },
            ].map(s => (
              <div key={s.l} className="text-center">
                <div className="text-3xl font-extrabold text-[#1A1410]">{s.v}</div>
                <div className="text-xs text-[#6B5A4A] mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="kz-card p-6 flex flex-col gap-4"
              style={{ background: t.color, borderColor: t.borderColor }}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={KZ.orange} stroke={KZ.orange} strokeWidth="1">
                    <path d="M12 3 L14.5 9 L21 9.5 L16 14 L17.5 21 L12 17 L6.5 21 L8 14 L3 9.5 L9.5 9 Z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm leading-relaxed text-[#1A1410] font-medium">
                &laquo;&nbsp;{t.body}&nbsp;&raquo;
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[#1A1410]/10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border border-[#1A1410] flex items-center justify-center text-sm font-extrabold text-white shrink-0"
                    style={{ background: t.avatarBg }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1A1410]">{t.name}</div>
                    <div className="text-xs text-[#6B5A4A]">{t.role}</div>
                    <div className="text-[11px] text-[#6B5A4A] opacity-70">{t.company}</div>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#1A1410]"
                  style={{ background: t.tagColor + '25', color: t.tagColor }}
                >
                  {t.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
