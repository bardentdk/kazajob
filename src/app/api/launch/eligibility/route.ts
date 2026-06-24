import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getActiveMembership } from '@/lib/queries/companies'
import { checkLaunchEligibility } from '@/lib/queries/launch'

// GET /api/launch/eligibility → statut d'éligibilité KazaLaunch de l'entreprise active.
// Décision 100 % serveur (le navigateur ne décide jamais).
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const membership = await getActiveMembership(userId)
  const result = await checkLaunchEligibility(membership?.companyId)
  return NextResponse.json(result)
}
