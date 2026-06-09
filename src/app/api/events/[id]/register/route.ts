import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { registerToEvent, unregisterFromEvent } from '@/lib/queries/events'

async function requireUser() {
  const session = await auth()
  return session?.user?.id ?? null
}

// POST /api/events/[id]/register — s'inscrire
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  await registerToEvent(userId, id)
  return NextResponse.json({ ok: true })
}

// DELETE /api/events/[id]/register — se désinscrire
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  await unregisterFromEvent(userId, id)
  return NextResponse.json({ ok: true })
}
