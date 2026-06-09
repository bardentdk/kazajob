import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPublicProfile } from '@/lib/queries/profiles'
import { listCandidateApplications } from '@/lib/queries/applications'

// GET /api/profiles/[id] — profil + candidatures (vue recruteur, réservé recruteur/admin)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = session?.user?.role
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (role !== 'recruiter' && role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params
  const profile = await getPublicProfile(id)
  if (!profile) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const applications = await listCandidateApplications(id)
  return NextResponse.json({ profile, applications })
}
