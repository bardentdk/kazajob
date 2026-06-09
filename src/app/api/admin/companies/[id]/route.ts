import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { setCompanyVerified } from '@/lib/queries/admin'

// PATCH /api/admin/companies/[id]  { verified: boolean }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { id } = await params
  const { verified } = await req.json().catch(() => ({}))
  await setCompanyVerified(id, !!verified)
  return NextResponse.json({ ok: true })
}
