import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { adminDeleteSlot } from '@/lib/queries/demo'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const { id } = await params
  await adminDeleteSlot(id)
  return NextResponse.json({ ok: true })
}
