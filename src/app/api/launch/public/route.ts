import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscriptionPlans } from '@/lib/db/schema'
import { LAUNCH_PLAN_ID } from '@/lib/constants'
import { launchGloballyAvailable } from '@/lib/launch'

// GET /api/launch/public → disponibilité publique de KazaLaunch (sans auth, sans données entreprise).
// Sert au wording dynamique des pages publiques (afficher/masquer l'offre gratuite).
export async function GET() {
  const [p] = await db.select({
    isActive: subscriptionPlans.isActive, isPublic: subscriptionPlans.isPublic,
    isSelectable: subscriptionPlans.isSelectable, startsAt: subscriptionPlans.startsAt, endsAt: subscriptionPlans.endsAt,
  }).from(subscriptionPlans).where(eq(subscriptionPlans.id, LAUNCH_PLAN_ID)).limit(1)

  const available = !!p && launchGloballyAvailable(p) === 'ok'
  return NextResponse.json({ available })
}
