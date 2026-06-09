import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { getAnalyticsData } from '@/lib/queries/admin'

// GET /api/admin/analytics — données brutes 8 semaines + totaux
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  return NextResponse.json(await getAnalyticsData())
}
