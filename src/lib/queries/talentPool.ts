/**
 * KAZAJOB — Vivier de talents (talent pool) recruteur.
 * Couche serveur. Un recruteur sauvegarde des profils candidats par catégorie.
 */
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { talentPool, profiles } from '@/lib/db/schema'

export interface TalentPoolEntry {
  id: string
  category: string
  note: string | null
  created_at: string
  candidate: {
    id: string
    full_name: string
    avatar_url: string | null
    location: string | null
    bio: string | null
  }
}

/** Sauvegarde (ou met à jour) un candidat dans le vivier du recruteur. */
export async function saveToPool(
  recruiterId: string,
  candidateId: string,
  category: string,
  note?: string | null,
): Promise<void> {
  await db.insert(talentPool)
    .values({ recruiterId, candidateId, category, note: note ?? null })
    .onConflictDoUpdate({
      target: [talentPool.recruiterId, talentPool.candidateId],
      set: { category, note: note ?? null },
    })
}

/** Liste le vivier du recruteur (avec infos candidat). */
export async function listPool(recruiterId: string): Promise<TalentPoolEntry[]> {
  const rows = await db
    .select({
      id: talentPool.id,
      category: talentPool.category,
      note: talentPool.note,
      createdAt: talentPool.createdAt,
      candidateId: profiles.id,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      location: profiles.location,
      bio: profiles.bio,
    })
    .from(talentPool)
    .innerJoin(profiles, eq(profiles.id, talentPool.candidateId))
    .where(eq(talentPool.recruiterId, recruiterId))
    .orderBy(desc(talentPool.createdAt))

  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    note: r.note,
    created_at: (r.createdAt as Date).toISOString(),
    candidate: {
      id: r.candidateId,
      full_name: r.fullName,
      avatar_url: r.avatarUrl,
      location: r.location,
      bio: r.bio,
    },
  }))
}

/** Retire un candidat du vivier du recruteur. */
export async function removeFromPool(recruiterId: string, candidateId: string): Promise<void> {
  await db.delete(talentPool)
    .where(and(eq(talentPool.recruiterId, recruiterId), eq(talentPool.candidateId, candidateId)))
}
