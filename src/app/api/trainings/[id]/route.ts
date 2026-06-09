import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTraining, hasAppliedToTraining } from '@/lib/queries/trainings'
import { listMyRegistrations } from '@/lib/queries/events'

// GET /api/trainings/[id] — détail + mon état (candidature / inscription IC)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const offer = await getTraining(id)
  if (!offer) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const session = await auth()
  const userId = session?.user?.id
  let is_applied = false
  let is_ic_registered = false
  if (userId) {
    is_applied = await hasAppliedToTraining(userId, id)
    const icId = (offer as { info_session_id?: string | null }).info_session_id
    if (icId) {
      const regs = await listMyRegistrations(userId)
      is_ic_registered = regs.includes(icId)
    }
  }
  return NextResponse.json({ offer, is_applied, is_ic_registered })
}
