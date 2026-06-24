import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getActiveMembership, getCompanyOverview } from '@/lib/queries/companies'
import { getLaunchStatus } from '@/lib/queries/launch'
import { LAUNCH_PLAN } from '@/lib/constants'

// GET /api/launch/status → état KazaLaunch de l'entreprise active (bannière dashboard).
// Renvoie null-ish si l'entreprise n'est pas sur l'offre gratuite.
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
    jobsMax: LAUNCH_PLAN.maxJobs,
    seatsUsed: overview.member_count,
    seatsMax: LAUNCH_PLAN.maxMembers,
  })
}
