/**
 * KAZAJOB — Requêtes Drizzle pour les entretiens.
 */
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { applications, interviews } from '@/lib/db/schema'
import { serialize } from './_serialize'

function jitsiLink(interviewId: string): string {
  return `https://meet.jit.si/kazajob-${interviewId.replace(/-/g, '').slice(0, 16)}`
}

interface CreateInterviewInput {
  applicationId: string
  candidateId: string
  jobId?: string | null
  scheduledAt: string
  durationMin?: number
  type?: string
  visioType?: string
  externalLink?: string
  location?: string
  notes?: string
}

/** Crée un entretien (réservé au recruteur propriétaire de l'offre). */
export async function createInterview(
  recruiterId: string,
  input: CreateInterviewInput,
): Promise<{ error: string | null; interview?: Record<string, unknown> }> {
  // Vérifie que le recruteur possède l'offre liée à la candidature.
  const app = await db.query.applications.findFirst({
    where: eq(applications.id, input.applicationId),
    with: { job: { columns: { recruiterId: true } } },
  })
  if (!app) return { error: 'Candidature introuvable' }
  if ((app as { job?: { recruiterId?: string } }).job?.recruiterId !== recruiterId) {
    return { error: 'Non autorisé' }
  }

  const type = input.type ?? 'video'
  const visioType = input.visioType ?? 'jitsi'
  const visioLink = type === 'video' && visioType !== 'jitsi' ? input.externalLink ?? null : null

  const [row] = await db.insert(interviews).values({
    applicationId: input.applicationId,
    recruiterId,
    candidateId:   input.candidateId,
    jobId:         input.jobId ?? null,
    scheduledAt:   new Date(input.scheduledAt),
    durationMin:   input.durationMin ?? 45,
    type,
    visioType:     type === 'video' ? visioType : null,
    visioLink,
    location:      type !== 'video' ? input.location ?? null : null,
    notes:         input.notes ?? null,
    status:        'pending',
  }).returning()

  // Jitsi : générer le lien maintenant qu'on a l'id.
  if (type === 'video' && visioType === 'jitsi') {
    const link = jitsiLink(row.id)
    await db.update(interviews).set({ visioLink: link }).where(eq(interviews.id, row.id))
    row.visioLink = link
  }

  // La candidature passe en "interview".
  await db.update(applications)
    .set({ status: 'interview', updatedAt: new Date() })
    .where(eq(applications.id, input.applicationId))

  return { error: null, interview: serialize<Record<string, unknown>>(row) }
}

/** Entretiens d'un utilisateur (selon son rôle). */
export async function listInterviews(userId: string, isRecruiter: boolean) {
  const rows = await db.query.interviews.findMany({
    where: isRecruiter ? eq(interviews.recruiterId, userId) : eq(interviews.candidateId, userId),
    with: {
      candidate: { columns: { id: true, fullName: true, email: true, avatarUrl: true } },
      recruiter: { columns: { id: true, fullName: true } },
      job: { columns: { title: true }, with: { company: { columns: { name: true } } } },
    },
    orderBy: (i, { asc }) => [asc(i.scheduledAt)],
  })
  return serialize<Record<string, unknown>[]>(rows)
}

/** Met à jour un entretien (recruteur ou candidat concerné). */
export async function updateInterview(
  userId: string,
  id: string,
  updates: Record<string, unknown>,
): Promise<{ error: string | null; interview?: Record<string, unknown> }> {
  const [itw] = await db.select({ recruiterId: interviews.recruiterId, candidateId: interviews.candidateId })
    .from(interviews).where(eq(interviews.id, id)).limit(1)
  if (!itw) return { error: 'Entretien introuvable' }
  if (itw.recruiterId !== userId && itw.candidateId !== userId) return { error: 'Non autorisé' }

  // Liste blanche des champs modifiables.
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if ('status' in updates) set.status = updates.status
  if ('notes' in updates) set.notes = updates.notes
  if ('scheduledAt' in updates) set.scheduledAt = new Date(String(updates.scheduledAt))
  if ('reminderSent' in updates) set.reminderSent = updates.reminderSent

  const [row] = await db.update(interviews).set(set).where(eq(interviews.id, id)).returning()
  return { error: null, interview: serialize<Record<string, unknown>>(row) }
}
