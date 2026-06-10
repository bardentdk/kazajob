import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { acceptInvitation } from '@/lib/queries/companies'

// POST /api/invitations/[token]/accept — rattache le recruteur connecté à l'entreprise
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { token } = await params
  const result = await acceptInvitation(userId, token)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 })
  return NextResponse.json({ ok: true, companyId: result.companyId })
}
