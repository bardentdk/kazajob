import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createBooking } from '@/lib/queries/demo'
import { demoBookingEmail } from '@/lib/email/templates'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'kazajob.re@gmail.com'
const FROM = process.env.RESEND_FROM ?? 'Kazajob <contact@velt.re>'

// POST /api/demo/book  { slotId?, name, company?, email, phone?, message? } — public
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const res = await createBooking(body)
  if (res.error) return NextResponse.json({ error: res.error }, { status: 400 })

  // Emails (fire & forget — n'empêchent pas la réservation).
  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const common = { name: body.name, company: body.company, email: body.email, phone: body.phone, message: body.message, when: res.when ?? null, durationMin: res.durationMin }
      const toProspect = demoBookingEmail({ recipient: 'prospect', ...common })
      const toAdmin = demoBookingEmail({ recipient: 'admin', ...common })
      await resend.emails.send({ from: FROM, to: body.email, subject: toProspect.subject, html: toProspect.html })
      await resend.emails.send({ from: FROM, to: ADMIN_EMAIL, subject: toAdmin.subject, html: toAdmin.html })
    }
  } catch (e) {
    console.error('[demo book email]', e)
  }

  return NextResponse.json({ ok: true, id: res.id })
}
