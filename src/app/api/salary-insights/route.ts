import { NextRequest, NextResponse } from 'next/server'
import { getSectorSalary } from '@/lib/queries/marketData'

// GET /api/salary-insights?sector=... → stats salariales réelles du secteur
export async function GET(req: NextRequest) {
  const sector = req.nextUrl.searchParams.get('sector')
  const data = await getSectorSalary(sector)
  return NextResponse.json(data)
}
