import { NextRequest, NextResponse } from 'next/server'
import { computeKazaScore } from '@/lib/queries/kaza-score'

// GET /api/kaza-score/[recruiterId] — score public d'un recruteur
export async function GET(_req: NextRequest, { params }: { params: Promise<{ recruiterId: string }> }) {
  const { recruiterId } = await params
  return NextResponse.json(await computeKazaScore(recruiterId))
}
