import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { listAllCompanies } from '@/lib/queries/admin'

// GET /api/admin/companies
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  return NextResponse.json(await listAllCompanies())
}
