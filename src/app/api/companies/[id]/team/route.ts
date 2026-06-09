import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTeam, isCompanyMember } from '@/lib/queries/companies'

// GET /api/companies/[id]/team — membres actifs + demandes en attente (membres only)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  if (!(await isCompanyMember(userId, id))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  return NextResponse.json(await getTeam(id))
}
