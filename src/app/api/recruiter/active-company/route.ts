import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { setActiveCompany } from '@/lib/queries/companies'

// POST /api/recruiter/active-company  { companyId } — bascule l'entreprise active
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { companyId } = await req.json().catch(() => ({}))
  if (!companyId) return NextResponse.json({ error: 'companyId requis' }, { status: 400 })

  const result = await setActiveCompany(userId, companyId)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 403 })
  return NextResponse.json({ ok: true })
}
