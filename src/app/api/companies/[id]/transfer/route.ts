import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { transferOwnership } from '@/lib/queries/companies'

// POST /api/companies/[id]/transfer  { memberId } — transfère la propriété (owner only)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const { memberId } = await req.json().catch(() => ({}))
  if (!memberId) return NextResponse.json({ error: 'memberId requis' }, { status: 400 })

  const result = await transferOwnership(userId, id, memberId)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 403 })
  return NextResponse.json({ ok: true })
}
