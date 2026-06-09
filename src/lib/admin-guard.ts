/**
 * KAZAJOB — Garde admin pour les routes /api/admin/*.
 * Renvoie l'id de l'utilisateur si admin, sinon null.
 */
import { auth } from '@/lib/auth'

export async function requireAdmin(): Promise<string | null> {
  const session = await auth()
  if (session?.user?.role !== 'admin') return null
  return session.user.id
}
