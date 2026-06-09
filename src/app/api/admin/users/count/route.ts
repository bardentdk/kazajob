import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { countUsers } from '@/lib/queries/admin'

// GET /api/admin/users/count?role=candidate|recruiter
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const role = req.nextUrl.searchParams.get('role')
  const count = await countUsers(role && role !== 'all' ? role : undefined)
  return NextResponse.json({ count })
}
