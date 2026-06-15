import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listPool, saveToPool } from '@/lib/queries/talentPool'
import { TALENT_POOL_CATEGORIES } from '@/lib/constants'

const VALID = TALENT_POOL_CATEGORIES.map((c) => c.id) as readonly string[]

// GET /api/recruiter/talent-pool → vivier du recruteur
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (session.user.role !== 'recruiter' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux recruteurs' }, { status: 403 })
  }
  return NextResponse.json(await listPool(userId))
}

// POST /api/recruiter/talent-pool  { candidateId, category, note? }
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (session.user.role !== 'recruiter' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux recruteurs' }, { status: 403 })
  }

  const { candidateId, category, note } = await req.json().catch(() => ({}))
  if (!candidateId) return NextResponse.json({ error: 'candidateId requis' }, { status: 400 })
  const cat = VALID.includes(category) ? category : 'a_contacter'

  await saveToPool(userId, String(candidateId), cat, note ?? null)
  return NextResponse.json({ ok: true })
}
