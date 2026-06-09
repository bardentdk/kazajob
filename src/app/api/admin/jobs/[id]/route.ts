import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { deleteJob, setJobActive } from '@/lib/queries/admin'

// PATCH /api/admin/jobs/[id]  { active: boolean }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { id } = await params
  const { active } = await req.json().catch(() => ({}))
  await setJobActive(id, !!active)
  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/jobs/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { id } = await params
  await deleteJob(id)
  return NextResponse.json({ ok: true })
}
