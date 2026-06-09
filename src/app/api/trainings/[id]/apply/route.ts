import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { applyToTraining } from '@/lib/queries/trainings'

// POST /api/trainings/[id]/apply  { motivation? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const { motivation } = await req.json().catch(() => ({}))
  const result = await applyToTraining(userId, id, motivation)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 })
  return NextResponse.json({ ok: true })
}
