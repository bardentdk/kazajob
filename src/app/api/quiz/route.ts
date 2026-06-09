import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { saveQuizResult } from '@/lib/queries/profiles'

// POST /api/quiz  { answers: number[] } → { archetype, ... }
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { answers } = await req.json().catch(() => ({}))
  const result = await saveQuizResult(userId, answers)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json(result.result)
}
