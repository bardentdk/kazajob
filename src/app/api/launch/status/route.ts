import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getActiveMembership, getCompanyOverview } from '@/lib/queries/companies'
import { getLaunchStatus } from '@/lib/queries/launch'

// GET /api/launch/status → état de la campagne de lancement de l'entreprise active (bannière dashboard).
// Renvoie onLaunch:false si l'entreprise n'est pas enrôlée dans une campagne active.
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const membership = await getActiveMembership(userId)
  if (!membership) return NextResponse.json({ onLaunch: false })

  const status = await getLaunchStatus(membership.companyId)
  if (!status) return NextResponse.json({ onLaunch: false })

  const overview = await getCompanyOverview(membership.companyId)
  return NextResponse.json({
    onLaunch: true,
    ...status,
    jobsUsed: overview.job_count,
    seatsUsed: overview.member_count,
  })
}
