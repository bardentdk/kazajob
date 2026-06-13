import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getStripe, STRIPE_ENABLED, APP_URL } from '@/lib/stripe'
import { getJobOwner } from '@/lib/queries/jobs'
import { JOB_BOOST_OPTIONS } from '@/lib/constants'

// POST /api/billing/boost-checkout  { jobId, days } → { url }
// Paiement unique (mode payment) pour mettre une offre en avant. Réservé au recruteur propriétaire.
export async function POST(req: NextRequest) {
  if (!STRIPE_ENABLED) return NextResponse.json({ error: 'Paiement non configuré.' }, { status: 503 })

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { jobId, days } = await req.json().catch(() => ({}))
  const option = JOB_BOOST_OPTIONS.find((o) => o.days === Number(days))
  if (!jobId || !option) return NextResponse.json({ error: 'Offre ou durée invalide.' }, { status: 400 })

  const job = await getJobOwner(String(jobId))
  if (!job) return NextResponse.json({ error: 'Offre introuvable.' }, { status: 404 })
  if (job.recruiterId !== userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const meta = { kind: 'job_boost', jobId: String(jobId), days: String(option.days) }

  const checkout = await getStripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: option.priceCts,
        product_data: { name: `Kazajob — Boost « ${job.title} » (${option.label})` },
      },
    }],
    metadata: meta,
    payment_intent_data: { metadata: meta },
    success_url: `${APP_URL}/recruiter/jobs?boost=success`,
    cancel_url: `${APP_URL}/recruiter/jobs?boost=cancel`,
  })

  return NextResponse.json({ url: checkout.url })
}
