/**
 * KAZAJOB — Requêtes Drizzle pour les candidatures (applications).
 * Couche serveur. Renvoie des objets conformes à `Application` (snake_case).
 */
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { applications, jobs, candidateSkills, skills, companySubscriptions } from '@/lib/db/schema'
import type { Application } from '@/lib/types'
import type { PrequalAnswer } from '@/lib/prequal'
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

/**
 * Contexte d'une candidature pour la synthèse IA (recruteur).
 * Renvoie l'offre, le candidat (avec ses compétences) et l'état d'abonnement
 * de l'entreprise (pour le contrôle de plan côté API).
 */
export async function getApplicationAIContext(applicationId: string): Promise<{
  recruiter_id: string
  company_id: string | null
  plan_id: string | null
  sub_status: string | null
  cover_letter: string | null
  job: { title: string; description: string; requirements: string | null; skills: string[] }
  candidate: { full_name: string; location: string | null; bio: string | null; skills: string[]; soft_skills: string[] }
} | null> {
  const row = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
    columns: { coverLetter: true, candidateId: true },
    with: {
      job: {
        columns: { title: true, description: true, requirements: true, recruiterId: true, companyId: true },
        with: { jobSkills: { with: { skill: { columns: { name: true } } } } },
      },
      candidate: { columns: { fullName: true, location: true, bio: true, softSkills: true } },
    },
  })
  if (!row) return null
  const r = row as typeof row & {
    candidateId: string
    job?: {
      title: string; description: string; requirements: string | null
      recruiterId: string; companyId: string | null
      jobSkills?: Array<{ skill?: { name: string } | null }>
    } | null
    candidate?: { fullName: string; location: string | null; bio: string | null; softSkills: string[] | null } | null
  }
  if (!r.job) return null

  // Compétences déclarées du candidat
  const cs = await db
    .select({ name: skills.name })
    .from(candidateSkills)
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .where(eq(candidateSkills.candidateId, r.candidateId))

  // Abonnement de l'entreprise (pour le gating de plan)
  let planId: string | null = null
  let subStatus: string | null = null
  if (r.job.companyId) {
    const [sub] = await db
      .select({ planId: companySubscriptions.planId, status: companySubscriptions.status })
      .from(companySubscriptions)
      .where(eq(companySubscriptions.companyId, r.job.companyId))
      .limit(1)
    planId = sub?.planId ?? null
    subStatus = sub?.status ?? null
  }

  return {
    recruiter_id: r.job.recruiterId,
    company_id: r.job.companyId,
    plan_id: planId,
    sub_status: subStatus,
    cover_letter: r.coverLetter ?? null,
    job: {
      title: r.job.title,
      description: r.job.description,
      requirements: r.job.requirements,
      skills: (r.job.jobSkills ?? []).map((js) => js.skill?.name).filter(Boolean) as string[],
    },
    candidate: {
      full_name: r.candidate?.fullName ?? 'Candidat',
      location: r.candidate?.location ?? null,
      bio: r.candidate?.bio ?? null,
      skills: cs.map((s) => s.name),
      soft_skills: r.candidate?.softSkills ?? [],
    },
  }
}

/** Postuler à une offre. Renvoie l'id créé ou une erreur métier. */
export async function applyToJob(
  candidateId: string,
  jobId: string,
  coverLetter?: string,
  prequalAnswers?: PrequalAnswer[],
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
    .values({ jobId, candidateId, coverLetter, prequalAnswers: prequalAnswers ?? null })
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
