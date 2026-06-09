import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { listUsers } from '@/lib/queries/admin'

// GET /api/admin/users?search=...
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const search = req.nextUrl.searchParams.get('search') ?? undefined
  return NextResponse.json(await listUsers(search))
}
