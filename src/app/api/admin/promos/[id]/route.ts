import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updatePromo, deletePromo, applyToActiveSubscriptions } from '@/lib/queries/promos'

// PATCH  { endDate?, active?, applyActive? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  if (body.applyActive) {
    const { applied } = await applyToActiveSubscriptions(id)
    return NextResponse.json({ ok: true, applied })
  }
  await updatePromo(id, { endDate: body.endDate, active: body.active })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const { id } = await params
  await deletePromo(id)
  return NextResponse.json({ ok: true })
}
