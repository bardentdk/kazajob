/**
 * KAZAJOB — Requêtes Drizzle pour les offres de formation.
 * Couche serveur. Renvoie des objets conformes à `TrainingOffer` (snake_case).
 */
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { trainingApplications, trainingOffers } from '@/lib/db/schema'
import type { TrainingOffer } from '@/lib/types'
import { serialize } from './_serialize'

const WITH_REL = {
  company: { columns: { name: true, logoUrl: true } },
  info_session: { columns: { id: true, title: true, date: true, jitsiRoom: true, maxParticipants: true } },
} as const

// Champs modifiables : clé API (snake_case) → colonne Drizzle.
const FIELDS: Record<string, keyof typeof trainingOffers.$inferInsert> = {
  title: 'title', description: 'description', program: 'program', prerequisites: 'prerequisites',
  certification: 'certification', certification_level: 'certificationLevel',
  duration_value: 'durationValue', duration_unit: 'durationUnit', location: 'location',
  remote: 'remote', sector: 'sector', start_date: 'startDate', max_participants: 'maxParticipants',
  is_financed: 'isFinanced', financing_options: 'financingOptions', image_url: 'imageUrl',
  info_session_id: 'infoSessionId', is_active: 'isActive',
}

function mapPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const set: Record<string, unknown> = {}
  for (const [k, col] of Object.entries(FIELDS)) {
    if (k in payload) set[col] = payload[k]
  }
  return set
}

/** Formations actives (catalogue candidat). */
export async function listPublishedTrainings(): Promise<TrainingOffer[]> {
  const rows = await db.query.trainingOffers.findMany({
    where: eq(trainingOffers.isActive, true),
    with: WITH_REL,
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })
  return serialize<TrainingOffer[]>(rows)
}

/** Formations d'un recruteur. */
export async function listRecruiterTrainings(recruiterId: string): Promise<TrainingOffer[]> {
  const rows = await db.select().from(trainingOffers)
    .where(eq(trainingOffers.recruiterId, recruiterId))
    .orderBy(sql`${trainingOffers.createdAt} desc`)
  return serialize<TrainingOffer[]>(rows)
}

/** Détail d'une formation (entreprise + session IC), incrémente les vues. */
export async function getTraining(id: string): Promise<TrainingOffer | null> {
  const row = await db.query.trainingOffers.findFirst({
    where: eq(trainingOffers.id, id),
    with: WITH_REL,
  })
  if (!row) return null
  await db.update(trainingOffers)
    .set({ views: sql`${trainingOffers.views} + 1` })
    .where(eq(trainingOffers.id, id))
  return serialize<TrainingOffer>(row)
}

/** Une formation brute appartenant au recruteur (édition), ou null. */
export async function getRecruiterTraining(recruiterId: string, id: string): Promise<TrainingOffer | null> {
  const [row] = await db.select().from(trainingOffers).where(eq(trainingOffers.id, id)).limit(1)
  if (!row || row.recruiterId !== recruiterId) return null
  return serialize<TrainingOffer>(row)
}

export async function createTraining(
  recruiterId: string,
  payload: Record<string, unknown>,
  companyId: string | null,
): Promise<string | undefined> {
  const values = {
    ...mapPayload(payload),
    recruiterId,
    companyId: companyId ?? null,
  } as typeof trainingOffers.$inferInsert
  const [row] = await db.insert(trainingOffers).values(values).returning({ id: trainingOffers.id })
  return row?.id
}

export async function updateTraining(
  recruiterId: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<{ error: string | null }> {
  const [t] = await db.select({ recruiterId: trainingOffers.recruiterId })
    .from(trainingOffers).where(eq(trainingOffers.id, id)).limit(1)
  if (!t) return { error: 'Formation introuvable' }
  if (t.recruiterId !== recruiterId) return { error: 'Non autorisé' }

  const set = mapPayload(payload)
  if (Object.keys(set).length > 0) {
    set.updatedAt = new Date()
    await db.update(trainingOffers).set(set as Partial<typeof trainingOffers.$inferInsert>).where(eq(trainingOffers.id, id))
  }
  return { error: null }
}

export async function deleteTraining(recruiterId: string, id: string): Promise<{ error: string | null }> {
  const [t] = await db.select({ recruiterId: trainingOffers.recruiterId })
    .from(trainingOffers).where(eq(trainingOffers.id, id)).limit(1)
  if (!t) return { error: 'Formation introuvable' }
  if (t.recruiterId !== recruiterId) return { error: 'Non autorisé' }
  await db.delete(trainingOffers).where(eq(trainingOffers.id, id))
  return { error: null }
}

/** Le candidat a-t-il déjà postulé à cette formation ? */
export async function hasAppliedToTraining(candidateId: string, trainingId: string): Promise<boolean> {
  const [row] = await db.select({ id: trainingApplications.id }).from(trainingApplications)
    .where(and(
      eq(trainingApplications.trainingOfferId, trainingId),
      eq(trainingApplications.candidateId, candidateId),
    )).limit(1)
  return !!row
}

/** Postuler à une formation (idempotent + incrémente le compteur). */
export async function applyToTraining(
  candidateId: string,
  trainingId: string,
  motivation?: string,
): Promise<{ error: string | null }> {
  if (await hasAppliedToTraining(candidateId, trainingId)) {
    return { error: 'Vous avez déjà postulé à cette formation' }
  }
  await db.insert(trainingApplications).values({
    trainingOfferId: trainingId,
    candidateId,
    motivation: motivation?.trim() || null,
  })
  await db.update(trainingOffers)
    .set({ applicationsCount: sql`${trainingOffers.applicationsCount} + 1` })
    .where(eq(trainingOffers.id, trainingId))
  return { error: null }
}
