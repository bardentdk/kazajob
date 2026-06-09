/**
 * KAZAJOB — Requêtes Drizzle pour les offres (jobs).
 * Couche serveur uniquement. Renvoie des objets conformes à `Job` (snake_case).
 */
import { and, desc, eq, gte, ilike, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { jobs } from '@/lib/db/schema'
import type { Job, JobFilters } from '@/lib/types'
import { serialize } from './_serialize'

type JobRow = typeof jobs.$inferSelect & {
  company: unknown
  jobSkills: Array<{ skill: unknown }>
}

function mapJob(row: JobRow): Job {
  const { jobSkills, company, ...rest } = row
  return serialize<Job>({
    ...rest,
    company,
    skills: jobSkills?.map((js) => js.skill) ?? [],
  })
}

function buildwhere(f: JobFilters): SQL | undefined {
  const conds: SQL[] = [eq(jobs.isActive, true)]
  if (f.q) conds.push(or(ilike(jobs.title, `%${f.q}%`), ilike(jobs.description, `%${f.q}%`))!)
  if (f.location) conds.push(eq(jobs.location, f.location))
  if (f.job_type) conds.push(eq(jobs.jobType, f.job_type))
  if (f.sector) conds.push(eq(jobs.sector, f.sector))
  if (f.remote !== undefined) conds.push(eq(jobs.remote, f.remote))
  if (f.salary_min) conds.push(gte(jobs.salaryMin, f.salary_min))
  return and(...conds)
}

/** Liste paginée des offres actives avec entreprise + compétences. */
export async function listJobs(f: JobFilters): Promise<{ data: Job[]; count: number }> {
  const page = f.page ?? 1
  const limit = f.limit ?? 12
  const offset = (page - 1) * limit
  const where = buildwhere(f)

  const rows = await db.query.jobs.findMany({
    where,
    with: { company: true, jobSkills: { with: { skill: true } } },
    orderBy: (j, { desc: d }) => [d(j.isBoosted), d(j.createdAt)],
    limit,
    offset,
  })

  const [{ value }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(jobs)
    .where(where)

  return { data: (rows as JobRow[]).map(mapJob), count: value }
}

// ── Côté recruteur ────────────────────────────────────────────────

/** Offres d'un recruteur (avec entreprise + auteur). */
export async function listRecruiterJobs(recruiterId: string): Promise<Job[]> {
  const rows = await db.query.jobs.findMany({
    where: eq(jobs.recruiterId, recruiterId),
    with: {
      company: { columns: { name: true, logoUrl: true } },
      publisher: { columns: { fullName: true } },
    },
    orderBy: (j, { desc: d }) => [d(j.createdAt)],
  })
  return serialize<Job[]>(rows)
}

/** Une offre brute appartenant au recruteur (pour l'édition), ou null. */
export async function getRecruiterJob(recruiterId: string, id: string): Promise<Job | null> {
  const [row] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1)
  if (!row || row.recruiterId !== recruiterId) return null
  return serialize<Job>(row)
}

// Champs d'offre modifiables : clé API (snake_case) → colonne Drizzle.
const JOB_FIELDS: Record<string, keyof typeof jobs.$inferInsert> = {
  title: 'title', description: 'description', requirements: 'requirements',
  location: 'location', job_type: 'jobType', sector: 'sector', remote: 'remote',
  salary_min: 'salaryMin', salary_max: 'salaryMax', salary_currency: 'salaryCurrency',
  is_anonymous: 'isAnonymous', is_active: 'isActive',
}

function mapJobPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const set: Record<string, unknown> = {}
  for (const [apiKey, col] of Object.entries(JOB_FIELDS)) {
    if (apiKey in payload) set[col] = payload[apiKey]
  }
  return set
}

/** Crée une offre pour le recruteur. */
export async function createJob(
  recruiterId: string,
  payload: Record<string, unknown>,
  companyId: string | null,
): Promise<string | undefined> {
  const values = {
    ...mapJobPayload(payload),
    recruiterId,
    publishedBy: recruiterId,
    companyId: companyId ?? null,
  } as typeof jobs.$inferInsert
  const [row] = await db.insert(jobs).values(values).returning({ id: jobs.id })
  return row?.id
}

/** Met à jour une offre (réservé au recruteur propriétaire). */
export async function updateJob(
  recruiterId: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<{ error: string | null }> {
  const [job] = await db.select({ recruiterId: jobs.recruiterId }).from(jobs).where(eq(jobs.id, id)).limit(1)
  if (!job) return { error: 'Offre introuvable' }
  if (job.recruiterId !== recruiterId) return { error: 'Non autorisé' }

  const set = mapJobPayload(payload)
  if (Object.keys(set).length > 0) {
    set.updatedAt = new Date()
    await db.update(jobs).set(set as Partial<typeof jobs.$inferInsert>).where(eq(jobs.id, id))
  }
  return { error: null }
}

/** Supprime une offre (réservé au recruteur propriétaire). */
export async function deleteRecruiterJob(recruiterId: string, id: string): Promise<{ error: string | null }> {
  const [job] = await db.select({ recruiterId: jobs.recruiterId }).from(jobs).where(eq(jobs.id, id)).limit(1)
  if (!job) return { error: 'Offre introuvable' }
  if (job.recruiterId !== recruiterId) return { error: 'Non autorisé' }
  await db.delete(jobs).where(eq(jobs.id, id))
  return { error: null }
}

/** Contexte d'une offre pour KazaIA (sans incrément de vues). */
export async function getJobAIContext(id: string): Promise<{
  title: string; description: string; location: string; job_type: string
  company_name: string; skills: string[]
} | null> {
  const row = await db.query.jobs.findFirst({
    where: eq(jobs.id, id),
    columns: { title: true, description: true, location: true, jobType: true },
    with: {
      company: { columns: { name: true } },
      jobSkills: { with: { skill: { columns: { name: true } } } },
    },
  })
  if (!row) return null
  const r = row as typeof row & {
    company?: { name: string } | null
    jobSkills?: Array<{ skill?: { name: string } | null }>
  }
  return {
    title: r.title,
    description: r.description,
    location: r.location,
    job_type: r.jobType,
    company_name: r.company?.name ?? "l'entreprise",
    skills: (r.jobSkills ?? []).map((js) => js.skill?.name).filter(Boolean) as string[],
  }
}

/** Une offre par id (entreprise + compétences), et incrémente les vues. */
export async function getJob(id: string): Promise<Job | null> {
  const row = await db.query.jobs.findFirst({
    where: eq(jobs.id, id),
    with: { company: true, jobSkills: { with: { skill: true } } },
  })
  if (!row) return null

  await db
    .update(jobs)
    .set({ views: sql`${jobs.views} + 1` })
    .where(eq(jobs.id, id))

  return mapJob(row as JobRow)
}
