import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createCompany } from '@/lib/queries/companies'

// POST /api/companies  { ...form, logoUrl }
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (!body?.name?.trim()) return NextResponse.json({ error: 'name requis' }, { status: 400 })

  const company = await createCompany(userId, body, body.logoUrl ?? null)
  return NextResponse.json(company)
}
