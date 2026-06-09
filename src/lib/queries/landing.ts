/**
 * KAZAJOB — Données pour la landing et le sitemap (server components).
 */
import { count, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { companies, jobs, profiles } from '@/lib/db/schema'
import type { Company } from '@/lib/types'
import { serialize } from './_serialize'

export interface FeaturedJob {
  id: string; title: string; location: string; job_type: string
  salary_min: number | null; salary_max: number | null; remote: boolean
  created_at: string; is_boosted: boolean
  company: { name: string } | null
  skills: Array<{ skill: { name: string } | null }>
}

/** Offres vedettes + entreprises vérifiées + compteurs. */
export async function getLandingData(): Promise<{
  featuredJobs: FeaturedJob[]
  companies: Company[]
  stats: { jobs: number; companies: number; users: number }
}> {
  const [rows, verified, [jc], [cc], [uc]] = await Promise.all([
    db.query.jobs.findMany({
      where: eq(jobs.isActive, true),
      with: {
        company: { columns: { name: true } },
        jobSkills: { with: { skill: { columns: { name: true } } } },
      },
      orderBy: (j, { desc: d }) => [d(j.isBoosted), d(j.createdAt)],
      limit: 6,
    }),
    db.select({ id: companies.id, name: companies.name }).from(companies)
      .where(eq(companies.isVerified, true)).orderBy(companies.name).limit(8),
    db.select({ v: count() }).from(jobs).where(eq(jobs.isActive, true)),
    db.select({ v: count() }).from(companies),
    db.select({ v: count() }).from(profiles).where(eq(profiles.role, 'candidate')),
  ])

  const featuredJobs = rows.map((r) => {
    const { jobSkills, ...rest } = r as typeof r & { jobSkills: unknown }
    return serialize<FeaturedJob>({ ...rest, skills: jobSkills })
  })

  return {
    featuredJobs,
    companies: serialize<Company[]>(verified),
    stats: { jobs: jc.v, companies: cc.v, users: uc.v },
  }
}

/** Offres actives pour le sitemap (id + date de maj). */
export async function getSitemapJobs(): Promise<Array<{ id: string; updated_at: string }>> {
  const rows = await db
    .select({ id: jobs.id, updatedAt: jobs.updatedAt })
    .from(jobs)
    .where(eq(jobs.isActive, true))
    .orderBy(desc(jobs.updatedAt))
    .limit(500)
  return rows.map((r) => ({ id: r.id, updated_at: r.updatedAt.toISOString() }))
}
