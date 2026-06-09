import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateApplicationStatus } from '@/lib/queries/applications'

// PATCH /api/applications/[id]  { status, notes }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const { status, notes } = await req.json().catch(() => ({}))
  if (!status) return NextResponse.json({ error: 'status requis' }, { status: 400 })

  const result = await updateApplicationStatus(userId, id, status, notes)
  if (result.error) {
    const code = result.error === 'Non autorisé' ? 403 : 404
    return NextResponse.json({ error: result.error }, { status: code })
  }

  return NextResponse.json({ ok: true })
}
