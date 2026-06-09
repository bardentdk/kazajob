import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listFavorites, toggleFavorite } from '@/lib/queries/favorites'

// GET /api/favorites
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  return NextResponse.json(await listFavorites(userId))
}

// POST /api/favorites  { jobId }  → toggle
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { jobId } = await req.json().catch(() => ({}))
  if (!jobId) return NextResponse.json({ error: 'jobId requis' }, { status: 400 })

  return NextResponse.json(await toggleFavorite(userId, jobId))
}
