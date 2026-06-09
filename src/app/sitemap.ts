import type { MetadataRoute } from 'next'
import { getSitemapJobs, getSitemapTrainings } from '@/lib/queries/landing'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://kazajob.re'
  const now = new Date()

  // ── Pages statiques ───────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: base,                         lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/candidate/jobs`,     lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${base}/candidate/training`, lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/auth/login`,         lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/auth/register`,      lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  // ── Pages dynamiques : offres + formations publiques ──────────
  let dynamicPages: MetadataRoute.Sitemap = []
  try {
    const [jobs, trainings] = await Promise.all([getSitemapJobs(), getSitemapTrainings()])
    dynamicPages = [
      ...jobs.map((j) => ({
        url: `${base}/candidate/jobs/${j.id}`,
        lastModified: new Date(j.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...trainings.map((t) => ({
        url: `${base}/candidate/training/${t.id}`,
        lastModified: new Date(t.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ]
  } catch {
    // DB non dispo au build → sitemap statique uniquement
  }

  return [...staticPages, ...dynamicPages]
}
