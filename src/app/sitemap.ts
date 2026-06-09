import type { MetadataRoute } from 'next'
import { getSitemapJobs } from '@/lib/queries/landing'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://kazajob.re'
  const now = new Date()

  // ── Pages statiques ───────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/candidate/jobs`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/auth/login`,     lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/auth/register`,  lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  // ── Pages dynamiques : offres d'emploi publiques ──────────────
  let jobPages: MetadataRoute.Sitemap = []
  try {
    const jobs = await getSitemapJobs()
    jobPages = jobs.map((job) => ({
      url: `${base}/candidate/jobs/${job.id}`,
      lastModified: new Date(job.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  } catch {
    // DB non dispo au build → sitemap statique uniquement
  }

  return [...staticPages, ...jobPages]
}
