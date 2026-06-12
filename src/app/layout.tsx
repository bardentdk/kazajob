import type { Metadata, Viewport } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { CookieConsent } from '@/components/layout/CookieConsent'

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
})

// ── Métadonnées SEO complètes ──────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL('https://kazajob.re'),

  title: {
    default: 'Kazajob — Emploi La Réunion 974 | Matching IA & Offres locales',
    template: '%s | Kazajob — Emploi 974',
  },
  description:
    'Kazajob est la plateforme d\'emploi nouvelle génération pour La Réunion (974). Trouvez votre prochain job avec le matching IA, postulez en 1 clic, préparez vos entretiens avec KazaIA. 100% gratuit pour les candidats.',
  keywords: [
    'emploi La Réunion', 'job 974', 'offres emploi Réunion', 'recrutement Réunion',
    'CDI Saint-Denis', 'CDD Saint-Pierre', 'travail Réunion', 'Kazajob',
    'plateforme emploi', 'matching emploi IA', 'offres emploi Saint-Denis',
    'job Saint-Pierre Réunion', 'recrutement 974', 'emploi DOM', 'travail outre-mer',
    'offres formation Réunion', 'alternance Réunion', 'stage Réunion',
    'BTP Réunion emploi', 'emploi santé Réunion', 'tech emploi Réunion',
    'commerce emploi Réunion', 'tourisme emploi Réunion',
  ],

  authors: [{ name: 'Kazajob', url: 'https://kazajob.re' }],
  creator: 'Kazajob SAS',
  publisher: 'Kazajob SAS',

  // ── Open Graph ────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'fr_RE',
    url: 'https://kazajob.re',
    siteName: 'Kazajob',
    title: 'Kazajob — Emploi La Réunion 974 | Matching IA',
    description:
      'La plateforme d\'emploi nouvelle génération pour La Réunion. Matching IA, CV Builder, KazaIA. une multitude d\'offres d\'emplois et d\'offres de formations à La Réunion. 100% gratuit pour les candidats.',
    images: [
      {
        url: '/kazajob.png',
        width: 2128,
        height: 2646,
        alt: 'Kazajob — Le travail péi, nouvelle génération',
      },
    ],
  },

  // ── Twitter Card ──────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    site: '@kazajob_re',
    creator: '@kazajob_re',
    title: 'Kazajob — Emploi La Réunion 974',
    description: 'La plateforme emploi pour La Réunion. Matching IA, une multitude d\'offres d\'emplois et d\'offres de formations à La Réunion, gratuit pour les candidats.',
    images: ['/kazajob.png'],
  },

  // ── Robots ───────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Canonique + App ───────────────────────────────────────────
  alternates: {
    canonical: 'https://kazajob.re',
    languages: { 'fr-RE': 'https://kazajob.re' },
  },
  category: 'jobs',

  // ── Vérification ─────────────────────────────────────────────
  // verification: {
  //   google: 'VOTRE_CODE_GOOGLE_SEARCH_CONSOLE',
  // },

  // ── App manifest ─────────────────────────────────────────────
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Kazajob',
    statusBarStyle: 'black-translucent',
  },

  // ── Icons ────────────────────────────────────────────────────
  icons: {
    icon: '/favicon.ico',
    apple: '/kazajob.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#6D3BEB',
}

// ── Données structurées JSON-LD ────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://kazajob.re/#organization',
      name: 'Kazajob',
      url: 'https://kazajob.re',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kazajob.re/kazajob.png',
      },
      description: 'Plateforme d\'emploi nouvelle génération pour La Réunion (974)',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Saint-Denis',
        addressRegion: 'La Réunion',
        postalCode: '97400',
        addressCountry: 'FR',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'kazajob.re@gmail.com',
        availableLanguage: 'French',
      },
      sameAs: ['https://linkedin.com/company/kazajob', 'https://instagram.com/kazajob_re'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://kazajob.re/#website',
      url: 'https://kazajob.re',
      name: 'Kazajob',
      publisher: { '@id': 'https://kazajob.re/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://kazajob.re/candidate/jobs?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={sora.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="google-site-verification" content="MtxOnoybw_y8up6WUcvgLhMwAB2_ahK0rcpu6GqgOYw" />
      </head>
      <body className="bg-[#FFF7EE] text-[#1A1410] antialiased min-h-screen">
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  )
}
