import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getJobSeo } from '@/lib/queries/jobs'

const BASE = 'https://kazajob.re'

// CDI/CDD/… → types d'emploi schema.org pour Google for Jobs
const EMPLOYMENT: Record<string, string> = {
  CDI: 'FULL_TIME', CDD: 'TEMPORARY', Stage: 'INTERN', Alternance: 'FULL_TIME',
  Freelance: 'CONTRACTOR', Indépendant: 'CONTRACTOR', 'Temps partiel': 'PART_TIME',
  Intérim: 'TEMPORARY',
}

// Codes postaux La Réunion → enrichit le PostalAddress (Google for Jobs)
const POSTAL_CODES: Record<string, string> = {
  'Saint-Denis': '97400', 'Saint-Paul': '97460', 'Saint-Pierre': '97410',
  'Le Tampon': '97430', 'Saint-Louis': '97450', 'Saint-André': '97440',
  'Saint-Leu': '97436', 'Saint-Benoît': '97470', 'Sainte-Marie': '97438',
  'Sainte-Suzanne': '97441', 'Saint-Joseph': '97480', 'Cilaos': '97413',
  'Saint-Gilles': '97434', 'Bras-Panon': '97412', 'Salazie': '97433',
}

function postalCodeFor(location?: string | null): string | undefined {
  if (!location) return undefined
  return Object.entries(POSTAL_CODES).find(([city]) => location.includes(city))?.[1]
}

function clean(s: string, max: number) {
  return (s || '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  const job = await getJobSeo(id)
  if (!job) return { title: 'Offre introuvable', robots: { index: false } }

  const title = `${job.title}${job.company ? ' — ' + job.company : ''} | Kazajob`
  const description = clean(job.description, 155) || `Offre d'emploi à ${job.location}, La Réunion. Postulez sur Kazajob.`
  const url = `${BASE}/candidate/jobs/${id}`

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: { index: job.isActive, follow: true },
    openGraph: { title, description, url, type: 'website', siteName: 'Kazajob', locale: 'fr_RE' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function JobDetailLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params
  const job = await getJobSeo(id)
  // URL d'offre invalide → vraie 404 (au lieu d'un 200 avec état d'erreur masqué)
  if (!job) notFound()

  const postalCode = postalCodeFor(job.location)
  // Les salaires < 15 000 sont mensuels, au-delà annuels (cf. benchmarks 974)
  const salaryRef = job?.salaryMin ?? job?.salaryMax ?? 0
  const salaryUnit = salaryRef > 15000 ? 'YEAR' : 'MONTH'

  const jsonLd = job && job.isActive ? {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.createdAt.toISOString(),
    validThrough: new Date(job.createdAt.getTime() + 60 * 86400000).toISOString(),
    employmentType: EMPLOYMENT[job.jobType] ?? 'OTHER',
    directApply: true,
    identifier: {
      '@type': 'PropertyValue',
      name: job.company ?? 'Kazajob',
      value: id,
    },
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company ?? 'Entreprise confidentielle',
      sameAs: BASE,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'La Réunion',
        ...(postalCode ? { postalCode } : {}),
        addressRegion: 'La Réunion',
        addressCountry: 'FR',
      },
    },
    ...(job.remote ? {
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: { '@type': 'AdministrativeArea', name: 'La Réunion' },
    } : {}),
    ...((job.salaryMin || job.salaryMax) ? {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'EUR',
        value: {
          '@type': 'QuantitativeValue',
          minValue: job.salaryMin ?? undefined,
          maxValue: job.salaryMax ?? undefined,
          unitText: salaryUnit,
        },
      },
    } : {}),
  } : null

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE },
      { '@type': 'ListItem', position: 2, name: "Offres d'emploi", item: `${BASE}/candidate/jobs` },
      { '@type': 'ListItem', position: 3, name: job.title, item: `${BASE}/candidate/jobs/${id}` },
    ],
  }

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  )
}
