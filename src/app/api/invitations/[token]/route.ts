import { NextResponse } from 'next/server'
import { getInvitationByToken } from '@/lib/queries/companies'

// GET /api/invitations/[token] — aperçu public d'une invitation valide
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const inv = await getInvitationByToken(token)
  if (!inv) return NextResponse.json({ error: 'Invitation invalide ou expirée' }, { status: 404 })
  return NextResponse.json({ company: inv.company, role: inv.role, email: inv.email })
}
