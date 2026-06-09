/**
 * KAZAJOB — KazaScore recruteur (réplique du RPC `compute_kaza_score`).
 * Réactivité 50% + rapidité 30% + progression 20%, sur 90 jours glissants.
 */
import { and, count, eq, inArray, ne, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { applications, jobs } from '@/lib/db/schema'

export interface KazaScore {
  score: number
  label: string
  total_apps: number
  responded: number
  avg_hours: number
  with_interview: number
}

const recent = sql`${applications.createdAt} > now() - interval '90 days'`

export async function computeKazaScore(recruiterId: string): Promise<KazaScore> {
  const base = (extra?: ReturnType<typeof and>) =>
    db.select({ v: count() })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(eq(jobs.recruiterId, recruiterId), recent, extra))

  const [{ v: total }] = await base()
  if (total === 0) {
    return { score: 0, label: 'Nouveau recruteur', total_apps: 0, responded: 0, avg_hours: 0, with_interview: 0 }
  }

  const [{ v: responded }] = await base(ne(applications.status, 'pending'))
  const [{ v: withInterview }] = await base(inArray(applications.status, ['interview', 'offer', 'hired']))

  const [{ v: avgHours }] = await db
    .select({ v: sql<number>`coalesce(avg(extract(epoch from (${applications.updatedAt} - ${applications.createdAt})) / 3600), 0)` })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(eq(jobs.recruiterId, recruiterId), recent, ne(applications.status, 'pending')))

  const avg = Number(avgHours) || 0
  const rateScore  = Math.min(100, Math.round((responded / total) * 100))
  const speedScore = avg <= 24 ? 100 : avg <= 48 ? 80 : avg <= 96 ? 60 : avg <= 168 ? 40 : 20
  const intervScore = Math.min(100, Math.round((withInterview / Math.max(responded, 1)) * 100))
  const score = Math.round(rateScore * 0.5 + speedScore * 0.3 + intervScore * 0.2)

  const label = score >= 85 ? 'Très réactif'
    : score >= 65 ? 'Réactif'
    : score >= 40 ? 'Peu réactif'
    : 'Inactif'

  return { score, label, total_apps: total, responded, avg_hours: avg, with_interview: withInterview }
}
