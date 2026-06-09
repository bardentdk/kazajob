import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createTraining, listRecruiterTrainings } from '@/lib/queries/trainings'

// GET /api/recruiter/trainings — mes formations
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  return NextResponse.json(await listRecruiterTrainings(userId))
}

// POST /api/recruiter/trainings  { ...payload, companyId? } → { id }
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (session.user.role !== 'recruiter' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux recruteurs' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const id = await createTraining(userId, body, body.companyId ?? null)
  return NextResponse.json({ id })
}
