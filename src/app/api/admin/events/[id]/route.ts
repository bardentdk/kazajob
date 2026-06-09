import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { deleteEvent, setEventPublished } from '@/lib/queries/admin'

// PATCH /api/admin/events/[id]  { published: boolean }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { id } = await params
  const { published } = await req.json().catch(() => ({}))
  await setEventPublished(id, !!published)
  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/events/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { id } = await params
  await deleteEvent(id)
  return NextResponse.json({ ok: true })
}
