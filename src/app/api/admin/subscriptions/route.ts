import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { listSubscriptions } from '@/lib/queries/admin'

// GET /api/admin/subscriptions
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  return NextResponse.json(await listSubscriptions())
}
