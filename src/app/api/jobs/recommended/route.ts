import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getRecommendedJobs } from '@/lib/queries/jobs'

// GET /api/jobs/recommended?limit=4 — offres matchées pour le candidat connecté
export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const limit = Number(req.nextUrl.searchParams.get('limit')) || 4
  return NextResponse.json(await getRecommendedJobs(userId, limit))
}
