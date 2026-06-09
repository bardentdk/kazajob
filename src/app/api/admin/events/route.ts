import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { listAdminEvents } from '@/lib/queries/admin'

// GET /api/admin/events — événements + organisateur + nb d'inscrits
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  return NextResponse.json(await listAdminEvents())
}
