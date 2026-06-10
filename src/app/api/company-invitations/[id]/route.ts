import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { revokeInvitation } from '@/lib/queries/companies'

// DELETE /api/company-invitations/[id] — révoque une invitation (owner/admin)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const result = await revokeInvitation(userId, id)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.error === 'Non autorisé' ? 403 : 404 })
  }
  return NextResponse.json({ ok: true })
}
