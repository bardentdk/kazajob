import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { respondJoinRequest } from '@/lib/queries/companies'

// POST /api/company-requests/[id]  { approve: boolean }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const { approve } = await req.json().catch(() => ({}))
  const result = await respondJoinRequest(userId, id, !!approve)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.error === 'Non autorisé' ? 403 : 404 })
  }
  return NextResponse.json({ ok: true })
}
