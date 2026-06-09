import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { updateSubscription } from '@/lib/queries/admin'

// PATCH /api/admin/subscriptions/[id]  { planId? , status? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { id } = await params
  const { planId, status } = await req.json().catch(() => ({}))
  await updateSubscription(id, { planId, status })
  return NextResponse.json({ ok: true })
}
