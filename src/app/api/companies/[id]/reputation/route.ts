import { NextRequest, NextResponse } from 'next/server'
import { getEmployerReputation } from '@/lib/queries/reputation'

// GET /api/companies/[id]/reputation → indicateurs de réputation (public)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getEmployerReputation(id)
  if (!data) return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 })
  return NextResponse.json(data)
}
