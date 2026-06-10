/**
 * KAZAJOB — Requêtes Drizzle pour les candidatures (applications).
 * Couche serveur. Renvoie des objets conformes à `Application` (snake_case).
 */
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { applications, jobs } from '@/lib/db/schema'
import type { Application } from '@/lib/types'
import { serialize } from './_serialize'

const withJob = { job: { with: { company: true } } } as const

/** Candidatures d'un candidat (avec offre + entreprise). */
export async function listCandidateApplications(candidateId: string): Promise<Application[]> {
  const rows = await db.query.applications.findMany({
    where: eq(applications.candidateId, candidateId),
    with: withJob,
    orderBy: (a, { desc: d }) => [d(a.createdAt)],
  })
  return serialize<Application[]>(rows)
}

/** Candidatures reçues par un recruteur (offre + entreprise + candidat). */
export async function listRecruiterApplications(recruiterId: string): Promise<Application[]> {
  const jobRows = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(eq(jobs.recruiterId, recruiterId))
  const jobIds = jobRows.map((j) => j.id)
  if (jobIds.length === 0) return []

  const rows = await db.query.applications.findMany({
    where: inArray(applications.jobId, jobIds),
    with: { job: { with: { company: true } }, candidate: true },
    orderBy: (a, { desc: d }) => [d(a.createdAt)],
  })
  return serialize<Application[]>(rows)
}

/** Postuler à une offre. Renvoie l'id créé ou une erreur métier. */
export async function applyToJob(
  candidateId: string,
  jobId: string,
  coverLetter?: string,
): Promise<{ error: string | null; id?: string }> {
  // Valide que l'offre existe et est toujours active avant toute candidature.
  const [job] = await db
    .select({ isActive: jobs.isActive })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1)
  if (!job) return { error: 'Offre introuvable' }
  if (!job.isActive) return { error: 'Cette offre n\'est plus disponible' }

  const [existing] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.jobId, jobId), eq(applications.candidateId, candidateId)))
    .limit(1)

  if (existing) return { error: 'Vous avez deja postule a cette offre' }

  const [inserted] = await db
    .insert(applications)
    .values({ jobId, candidateId, coverLetter })
    .returning({ id: applications.id })

  await db
    .update(jobs)
    .set({ applicationsCount: sql`${jobs.applicationsCount} + 1` })
    .where(eq(jobs.id, jobId))

  return { error: null, id: inserted.id }
}

/** Retire sa candidature (réservé au candidat propriétaire). */
export async function withdrawApplication(
  candidateId: string,
  applicationId: string,
): Promise<{ error: string | null }> {
  const [row] = await db
    .select({ candidateId: applications.candidateId })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1)
  if (!row) return { error: 'Candidature introuvable' }
  if (row.candidateId !== candidateId) return { error: 'Non autorisé' }

  await db
    .update(applications)
    .set({ status: 'withdrawn', updatedAt: new Date() })
    .where(eq(applications.id, applicationId))
  return { error: null }
}

/** Change le statut d'une candidature (réservé au recruteur propriétaire). */
export async function updateApplicationStatus(
  recruiterId: string,
  applicationId: string,
  status: Application['status'],
  notes?: string,
): Promise<{ error: string | null }> {
  // Vérifie que la candidature porte sur une offre du recruteur.
  const row = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
    with: { job: { columns: { recruiterId: true } } },
  })
  if (!row) return { error: 'Candidature introuvable' }
  if ((row as { job?: { recruiterId?: string } }).job?.recruiterId !== recruiterId) {
    return { error: 'Non autorisé' }
  }

  await db
    .update(applications)
    .set({ status, recruiterNotes: notes, updatedAt: new Date() })
    .where(eq(applications.id, applicationId))

  return { error: null }
}
