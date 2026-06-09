import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateReferralCode, getReferralStats } from '@/lib/queries/referrals'

// GET /api/referral — stats de parrainage
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  return NextResponse.json(await getReferralStats(userId))
}

// POST /api/referral — génère mon code de parrainage → { code }
export async function POST() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const code = await generateReferralCode(userId)
  return NextResponse.json({ code })
}
