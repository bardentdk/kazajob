import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markAllNotificationsRead, markNotificationRead } from '@/lib/queries/notifications'

// PATCH /api/notifications/[id]   → marque une notif comme lue
//        /api/notifications/all   → marque toutes comme lues
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  if (id === 'all') {
    await markAllNotificationsRead(userId)
  } else {
    await markNotificationRead(userId, id)
  }
  return NextResponse.json({ ok: true })
}
