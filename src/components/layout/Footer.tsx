import Link from 'next/link'
import { Logo } from './Logo'

const FOOTER_LINKS = [
  {
    title: 'Candidats',
    links: [
      { label: "Offres d'emploi", href: '/candidate/jobs' },
      { label: 'Mon profil',      href: '/candidate/profile' },
      { label: 'Candidatures',   href: '/candidate/applications' },
      { label: 'Favoris',        href: '/candidate/favorites' },
    ],
  },
  {
    title: 'Recruteurs',
    links: [
      { label: 'Publier une offre',    href: '/auth/register?role=recruiter' },
      { label: 'Espace recruteur',     href: '/recruiter/dashboard' },
      { label: 'Voir les candidats',   href: '/recruiter/applications' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '/a-propos' },
      { label: 'Blog',     href: '/blog' },
      { label: 'Contact',  href: '/contact' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Mentions légales',  href: '/legal/mentions-legales' },
      { label: 'CGU',               href: '/legal/cgu' },
      { label: 'CGV',               href: '/legal/cgv' },
      { label: 'Confidentialité',   href: '/legal/confidentialite' },
      { label: 'Cookies',           href: '/legal/cookies' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-[#1A1410] text-[#FFF7EE] pt-10 lg:pt-12 pb-6 lg:pb-8 px-4 sm:px-8 lg:px-16">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-8">
        {/* Logo + description */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <Logo size={28} mono color="#FFF7EE" accentColor="#FF6B35" href="/" />
          <p className="text-sm opacity-70 mt-3 max-w-[280px] leading-relaxed">
            La plateforme d&apos;emploi nouvelle generation pour La Reunion.
            Fait avec <span className="text-[#FF6B35]">amour</span> a Saint-Denis.
          </p>
        </div>

        {FOOTER_LINKS.map((col) => (
          <div key={col.title}>
            <div className="text-xs font-bold text-[#FF6B35] mb-3 uppercase tracking-widest">
              {col.title}
            </div>
            <ul className="flex flex-col gap-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm opacity-75 hover:opacity-100 hover:text-[#FF6B35] transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-2 text-xs opacity-50">
        <span>© 2026 Kazajob · La Réunion 974</span>
        <span>Fait avec passion dans le 974</span>
      </div>
    </footer>
  )
}
