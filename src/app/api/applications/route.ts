import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  applyToJob,
  listCandidateApplications,
  listRecruiterApplications,
} from '@/lib/queries/applications'

// GET /api/applications?scope=candidate|recruiter
export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const scope = req.nextUrl.searchParams.get('scope')
  const data = scope === 'recruiter'
    ? await listRecruiterApplications(userId)
    : await listCandidateApplications(userId)

  return NextResponse.json(data)
}

// POST /api/applications  { jobId, coverLetter }
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { jobId, coverLetter } = await req.json().catch(() => ({}))
  if (!jobId) return NextResponse.json({ error: 'jobId requis' }, { status: 400 })

  const result = await applyToJob(userId, jobId, coverLetter)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 })

  return NextResponse.json({ id: result.id })
}
