import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listMyRegistrations, listPublishedEvents } from '@/lib/queries/events'

// GET /api/events — événements publiés, avec mon état d'inscription
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const [evs, myRegs] = await Promise.all([listPublishedEvents(), listMyRegistrations(userId)])
  const registered = new Set(myRegs)
  const data = evs.map((e) => ({ ...e, is_registered: registered.has(e.id as string) }))
  return NextResponse.json(data)
}
