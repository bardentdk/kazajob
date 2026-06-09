/**
 * KAZAJOB — Requêtes Drizzle pour le parrainage.
 */
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { profiles, referrals } from '@/lib/db/schema'

/** Stats de parrainage d'un utilisateur : nombre de filleuls + récompensés. */
export async function getReferralStats(referrerId: string): Promise<{ count: number; rewarded: number }> {
  const rows = await db
    .select({ rewarded: referrals.rewarded })
    .from(referrals)
    .where(eq(referrals.referrerId, referrerId))
  return {
    count: rows.length,
    rewarded: rows.filter((r) => r.rewarded).length,
  }
}

/** Génère un code de parrainage si l'utilisateur n'en a pas. Renvoie le code. */
export async function generateReferralCode(userId: string): Promise<string | null> {
  const [profile] = await db
    .select({ code: profiles.referralCode })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
  if (!profile) return null
  if (profile.code) return profile.code

  const code = Math.random().toString(36).slice(2, 10).toUpperCase()
  await db.update(profiles).set({ referralCode: code }).where(eq(profiles.id, userId))
  return code
}
