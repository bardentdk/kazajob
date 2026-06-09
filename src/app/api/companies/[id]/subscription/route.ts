import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { setCompanySubscription } from '@/lib/queries/companies'

// POST /api/companies/[id]/subscription  { planId }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const { planId } = await req.json().catch(() => ({}))
  if (!planId) return NextResponse.json({ error: 'planId requis' }, { status: 400 })

  const result = await setCompanySubscription(userId, id, planId)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.error === 'Non autorisé' ? 403 : 404 })
  }
  return NextResponse.json({ ok: true })
}
