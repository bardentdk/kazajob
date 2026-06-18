import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { adminListSlots, adminCreateSlots } from '@/lib/queries/demo'

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  return NextResponse.json(await adminListSlots())
}

// POST { starts: string[] (ISO), durationMin? }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const { starts, durationMin } = await req.json().catch(() => ({}))
  if (!Array.isArray(starts) || !starts.length) return NextResponse.json({ error: 'Aucun créneau' }, { status: 400 })
  const created = await adminCreateSlots(starts, durationMin ?? 30)
  return NextResponse.json({ ok: true, created })
}
