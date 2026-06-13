import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getStripe, STRIPE_ENABLED, APP_URL } from '@/lib/stripe'
import { PROFILE_BOOST_OPTIONS } from '@/lib/constants'

// POST /api/billing/profile-boost-checkout  { days } → { url }
// Paiement unique (mode payment) pour mettre son profil candidat en avant.
export async function POST(req: NextRequest) {
  if (!STRIPE_ENABLED) return NextResponse.json({ error: 'Paiement non configuré.' }, { status: 503 })

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { days } = await req.json().catch(() => ({}))
  const option = PROFILE_BOOST_OPTIONS.find((o) => o.days === Number(days))
  if (!option) return NextResponse.json({ error: 'Durée invalide.' }, { status: 400 })

  const meta = { kind: 'profile_boost', userId, days: String(option.days) }

  const checkout = await getStripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: option.priceCts,
        product_data: { name: `Kazajob — Profil mis en avant (${option.label})` },
      },
    }],
    metadata: meta,
    payment_intent_data: { metadata: meta },
    success_url: `${APP_URL}/candidate/profile?boost=success`,
    cancel_url: `${APP_URL}/candidate/profile?boost=cancel`,
  })

  return NextResponse.json({ url: checkout.url })
}
