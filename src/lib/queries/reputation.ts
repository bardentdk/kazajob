/**
 * KAZAJOB — Réputation employeur (indicateurs RÉELS, sans système d'avis).
 * Calculé depuis les offres et candidatures réelles de l'entreprise.
 */
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { companies, jobs, applications } from '@/lib/db/schema'

export interface EmployerReputation {
  isVerified: boolean
  jobsActive: number
  jobsTotal: number
  applicationsTotal: number
  responseRate: number | null   // % candidatures traitées (statut ≠ pending)
  avgResponseDays: number | null
  lastActiveDays: number | null  // jours depuis la dernière activité (offre maj/publiée)
}

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v))

export async function getEmployerReputation(companyId: string): Promise<EmployerReputation | null> {
  const [company] = await db
    .select({ isVerified: companies.isVerified, createdAt: companies.createdAt })
    .from(companies).where(eq(companies.id, companyId)).limit(1)
  if (!company) return null

  const [jc] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${jobs.isActive})::int`,
      lastAt: sql<string | null>`max(${jobs.updatedAt})`,
    })
    .from(jobs).where(eq(jobs.companyId, companyId))

  const [ac] = await db
    .select({
      total: sql<number>`count(*)::int`,
      answered: sql<number>`count(*) filter (where ${applications.status} <> 'pending')::int`,
      avgDays: sql<number | null>`round(avg(extract(epoch from (${applications.updatedAt} - ${applications.createdAt})) / 86400.0) filter (where ${applications.status} <> 'pending'))::int`,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(eq(jobs.companyId, companyId))

  const appsTotal = Number(ac?.total ?? 0)
  const answered = Number(ac?.answered ?? 0)
  const lastAt = jc?.lastAt ? new Date(jc.lastAt) : (company.createdAt as Date | null)
  const lastActiveDays = lastAt ? Math.max(0, Math.floor((Date.now() - lastAt.getTime()) / 86_400_000)) : null

  return {
    isVerified: !!company.isVerified,
    jobsActive: Number(jc?.active ?? 0),
    jobsTotal: Number(jc?.total ?? 0),
    applicationsTotal: appsTotal,
    responseRate: appsTotal > 0 ? Math.round((answered / appsTotal) * 100) : null,
    avgResponseDays: num(ac?.avgDays),
    lastActiveDays,
  }
}
