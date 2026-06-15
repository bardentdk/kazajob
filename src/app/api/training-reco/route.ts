import { NextRequest, NextResponse } from 'next/server'
import { recommendTrainings } from '@/lib/queries/marketData'

// GET /api/training-reco?sector=... → formations réelles recommandées
export async function GET(req: NextRequest) {
  const sector = req.nextUrl.searchParams.get('sector')
  const data = await recommendTrainings(sector, 4)
  return NextResponse.json(data)
}
