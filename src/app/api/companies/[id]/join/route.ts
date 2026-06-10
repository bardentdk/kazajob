import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requestToJoin } from '@/lib/queries/companies'

// POST /api/companies/[id]/join  { message? } → { id }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const { message } = await req.json().catch(() => ({}))
  const result = await requestToJoin(userId, id, message)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 })
  return NextResponse.json({ id: result.id })
}
