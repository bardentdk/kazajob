import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listNotifications } from '@/lib/queries/notifications'

// GET /api/notifications — 30 dernières
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  return NextResponse.json(await listNotifications(userId))
}
