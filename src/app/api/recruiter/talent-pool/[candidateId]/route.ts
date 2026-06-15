import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { removeFromPool } from '@/lib/queries/talentPool'

// DELETE /api/recruiter/talent-pool/[candidateId] — retire un candidat du vivier
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ candidateId: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { candidateId } = await params
  await removeFromPool(userId, candidateId)
  return NextResponse.json({ ok: true })
}
