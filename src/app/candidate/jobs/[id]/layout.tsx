import type { Metadata } from 'next'
import { getJobSeo } from '@/lib/queries/jobs'

const BASE = 'https://kazajob.re'

// CDI/CDD/… → types d'emploi schema.org pour Google for Jobs
const EMPLOYMENT: Record<string, string> = {
  CDI: 'FULL_TIME', CDD: 'TEMPORARY', Stage: 'INTERN', Alternance: 'FULL_TIME',
  Freelance: 'CONTRACTOR', Indépendant: 'CONTRACTOR', 'Temps partiel': 'PART_TIME',
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

  const jsonLd = job && job.isActive ? {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.createdAt.toISOString(),
    validThrough: new Date(job.createdAt.getTime() + 60 * 86400000).toISOString(),
    employmentType: EMPLOYMENT[job.jobType] ?? 'OTHER',
    directApply: true,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company ?? 'Entreprise confidentielle',
      sameAs: BASE,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        addressRegion: 'La Réunion',
        addressCountry: 'FR',
      },
    },
    ...(job.remote ? { jobLocationType: 'TELECOMMUTE' } : {}),
    ...((job.salaryMin || job.salaryMax) ? {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'EUR',
        value: {
          '@type': 'QuantitativeValue',
          minValue: job.salaryMin ?? undefined,
          maxValue: job.salaryMax ?? undefined,
          unitText: 'YEAR',
        },
      },
    } : {}),
  } : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {children}
    </>
  )
}
