import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { leaveCompany } from '@/lib/queries/companies'

// POST /api/companies/[id]/leave — quitter volontairement l'entreprise
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const result = await leaveCompany(userId, id)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 })
  return NextResponse.json({ ok: true })
}
