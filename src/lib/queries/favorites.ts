/**
 * KAZAJOB — Requêtes Drizzle pour les favoris.
 * Couche serveur. Renvoie des objets conformes à `Favorite` (snake_case).
 */
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { favorites } from '@/lib/db/schema'
import type { Favorite } from '@/lib/types'
import { serialize } from './_serialize'

type FavRow = typeof favorites.$inferSelect & {
  job?: { jobSkills?: Array<{ skill: unknown }> } & Record<string, unknown>
}

/** Favoris d'un candidat (offre + entreprise + compétences aplaties). */
export async function listFavorites(candidateId: string): Promise<Favorite[]> {
  const rows = await db.query.favorites.findMany({
    where: eq(favorites.candidateId, candidateId),
    with: { job: { with: { company: true, jobSkills: { with: { skill: true } } } } },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  })

  const mapped = (rows as FavRow[]).map((f) => {
    const { job, ...rest } = f
    return {
      ...rest,
      job: job
        ? (() => {
            const { jobSkills, ...jobRest } = job
            return { ...jobRest, skills: jobSkills?.map((js) => js.skill) ?? [] }
          })()
        : undefined,
    }
  })

  return serialize<Favorite[]>(mapped)
}

/** Ajoute/retire un favori. Renvoie l'état final (`favorited`). */
export async function toggleFavorite(
  candidateId: string,
  jobId: string,
): Promise<{ favorited: boolean }> {
  const [existing] = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.jobId, jobId), eq(favorites.candidateId, candidateId)))
    .limit(1)

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id))
    return { favorited: false }
  }

  await db.insert(favorites).values({ jobId, candidateId })
  return { favorited: true }
}
