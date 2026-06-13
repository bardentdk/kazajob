import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { canPublishJob, getActiveMembership } from '@/lib/queries/companies'

// GET /api/recruiter/quota → { ok, max, used, planName, reason? }
// Quota d'offres actives du forfait courant (pour l'UI recruteur).
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const membership = await getActiveMembership(userId)
  if (!membership) return NextResponse.json({ error: 'Aucune entreprise active.' }, { status: 400 })

  const quota = await canPublishJob(membership.companyId)
  return NextResponse.json(quota)
}
