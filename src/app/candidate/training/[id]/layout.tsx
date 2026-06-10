import type { Metadata } from 'next'
import { getTrainingSeo } from '@/lib/queries/trainings'

const BASE = 'https://kazajob.re'

function clean(s: string, max: number) {
  return (s || '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  const t = await getTrainingSeo(id)
  if (!t) return { title: 'Formation introuvable', robots: { index: false } }

  const title = `${t.title}${t.company ? ' — ' + t.company : ''} | Formation La Réunion`
  const description = clean(t.description, 155) || `Formation ${t.title} à ${t.location}, La Réunion. Sur Kazajob.`
  const url = `${BASE}/candidate/training/${id}`

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: { index: t.isActive, follow: true },
    openGraph: { title, description, url, type: 'website', siteName: 'Kazajob', locale: 'fr_RE' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function TrainingDetailLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params
  const t = await getTrainingSeo(id)

  const jsonLd = t && t.isActive ? {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: t.title,
    description: t.description,
    ...(t.certification ? { educationalCredentialAwarded: t.certification } : {}),
    provider: {
      '@type': 'Organization',
      name: t.company ?? 'Organisme de formation',
      sameAs: BASE,
    },
    locationCreated: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: t.location, addressRegion: 'La Réunion', addressCountry: 'FR' },
    },
  } : null

  const breadcrumb = t ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Formations', item: `${BASE}/candidate/training` },
      { '@type': 'ListItem', position: 3, name: t.title, item: `${BASE}/candidate/training/${id}` },
    ],
  } : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {breadcrumb && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      )}
      {children}
    </>
  )
}
