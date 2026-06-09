import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createEvent, listOrganizerEvents } from '@/lib/queries/events'

// GET /api/recruiter/events — mes événements
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  return NextResponse.json(await listOrganizerEvents(userId))
}

// POST /api/recruiter/events  { ...form } → { id }
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (session.user.role !== 'recruiter' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux recruteurs' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  if (!body?.title?.trim() || !body?.date) {
    return NextResponse.json({ error: 'title et date requis' }, { status: 400 })
  }
  const id = await createEvent(userId, body)
  return NextResponse.json({ id })
}
