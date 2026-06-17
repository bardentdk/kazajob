import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listPromos, createPromo, type PromoInput } from '@/lib/queries/promos'

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  return NextResponse.json(await listPromos())
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const body = await req.json().catch(() => ({})) as PromoInput
  const res = await createPromo(body)
  if (res.error) return NextResponse.json({ error: res.error }, { status: 400 })
  return NextResponse.json({ ok: true, id: res.id })
}
