import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { adminUpdateBookingStatus } from '@/lib/queries/demo'

// PATCH { status: 'confirmed' | 'cancelled' | 'done' }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const { id } = await params
  const { status } = await req.json().catch(() => ({}))
  await adminUpdateBookingStatus(id, status)
  return NextResponse.json({ ok: true })
}
