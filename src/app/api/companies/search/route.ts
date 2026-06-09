import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchCompanies } from '@/lib/queries/companies'

// GET /api/companies/search?q=...
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const q = req.nextUrl.searchParams.get('q') ?? ''
  return NextResponse.json(await searchCompanies(q))
}
