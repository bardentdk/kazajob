import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listConversations, startConversation } from '@/lib/queries/messages'

// GET /api/conversations — mes conversations
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  return NextResponse.json(await listConversations(userId))
}

// POST /api/conversations  { candidateId, recruiterId, jobId? } → id (idempotent)
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { candidateId, recruiterId, jobId } = await req.json().catch(() => ({}))
  if (!candidateId || !recruiterId) {
    return NextResponse.json({ error: 'candidateId et recruiterId requis' }, { status: 400 })
  }
  // L'utilisateur doit être partie prenante de la conversation.
  if (userId !== candidateId && userId !== recruiterId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const id = await startConversation(candidateId, recruiterId, jobId)
  return NextResponse.json({ id })
}
