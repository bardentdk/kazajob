import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isParticipant, listMessages, markConversationRead, sendMessage } from '@/lib/queries/messages'

// GET /api/conversations/[id]/messages — liste + marque comme lus
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  if (!(await isParticipant(id, userId))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const data = await listMessages(id)
  await markConversationRead(id, userId)
  return NextResponse.json(data)
}

// POST /api/conversations/[id]/messages  { content }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  if (!(await isParticipant(id, userId))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { content } = await req.json().catch(() => ({}))
  if (!content?.trim()) return NextResponse.json({ error: 'content requis' }, { status: 400 })

  await sendMessage(id, userId, content)
  return NextResponse.json({ ok: true })
}
