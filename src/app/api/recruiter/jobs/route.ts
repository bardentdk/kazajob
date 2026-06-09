import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createJob, listRecruiterJobs } from '@/lib/queries/jobs'

// GET /api/recruiter/jobs — mes offres
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  return NextResponse.json(await listRecruiterJobs(userId))
}

// POST /api/recruiter/jobs  { ...payload, companyId? } → { id }
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (session.user.role !== 'recruiter' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux recruteurs' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const id = await createJob(userId, body, body.companyId ?? null)
  return NextResponse.json({ id })
}
