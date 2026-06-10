import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listMemberships } from '@/lib/queries/companies'

// GET /api/recruiter/memberships — toutes les entreprises du recruteur (sélecteur)
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  return NextResponse.json(await listMemberships(userId))
}
