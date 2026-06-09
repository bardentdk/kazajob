import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { getAIStats } from '@/lib/queries/admin'

// GET /api/admin/ai-stats — estimations d'usage IA
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  return NextResponse.json(await getAIStats())
}
