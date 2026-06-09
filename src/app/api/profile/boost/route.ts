import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { boostProfile } from '@/lib/queries/profiles'

// POST /api/profile/boost — active un KazaBoost (coûte des XP)
export async function POST() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const result = await boostProfile(userId)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
