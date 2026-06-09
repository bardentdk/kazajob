import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { setUserRole } from '@/lib/queries/admin'

// PATCH /api/admin/users/[id]  { role }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { id } = await params
  const { role } = await req.json().catch(() => ({}))
  if (!role) return NextResponse.json({ error: 'role requis' }, { status: 400 })
  await setUserRole(id, role)
  return NextResponse.json({ ok: true })
}
