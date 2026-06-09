import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateProfile } from '@/lib/queries/profiles'

// PATCH /api/profile  { ...champs autorisés }
export async function PATCH(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const patch = await req.json().catch(() => ({}))
  await updateProfile(userId, patch)
  return NextResponse.json({ ok: true })
}
