import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { withdrawApplication } from '@/lib/queries/applications'

// POST /api/applications/[id]/withdraw — le candidat retire sa candidature
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const result = await withdrawApplication(userId, id)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.error === 'Non autorisé' ? 403 : 404 })
  }
  return NextResponse.json({ ok: true })
}
