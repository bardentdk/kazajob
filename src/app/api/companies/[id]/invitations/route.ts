import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createInvitation, isCompanyMember, listInvitations } from '@/lib/queries/companies'

// GET /api/companies/[id]/invitations — invitations en attente (membres)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  if (!(await isCompanyMember(userId, id))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  return NextResponse.json(await listInvitations(id))
}

// POST /api/companies/[id]/invitations  { email?, role? } → { token } (owner/admin)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const { email, role } = await req.json().catch(() => ({}))
  const result = await createInvitation(userId, id, { email, role })
  if (result.error) return NextResponse.json({ error: result.error }, { status: 403 })
  return NextResponse.json({ token: result.token })
}
