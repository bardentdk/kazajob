import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validatePromo } from '@/lib/queries/promos'

// GET /api/billing/validate-promo?code=... → { valid, label?, reason? }
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const code = req.nextUrl.searchParams.get('code') ?? ''
  const r = await validatePromo(code)
  return NextResponse.json({ valid: r.valid, label: r.label, reason: r.reason })
}
