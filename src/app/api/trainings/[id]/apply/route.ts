import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trainingOffers, profiles, companies } from '@/lib/db/schema'
import { applyToTraining } from '@/lib/queries/trainings'
import { sendApplicationDetail } from '@/lib/email/sendApplication'

// POST /api/trainings/[id]/apply  { motivation? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const { motivation } = await req.json().catch(() => ({}))
  const result = await applyToTraining(userId, id, motivation)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 })

  // Email au contact (annonce externe admin) ou au recruteur — fire & forget.
  try {
    const [t] = await db.select({
      title: trainingOffers.title, contactEmail: trainingOffers.contactEmail,
      externalCompany: trainingOffers.externalCompany, recruiterId: trainingOffers.recruiterId,
      companyId: trainingOffers.companyId,
    }).from(trainingOffers).where(eq(trainingOffers.id, id)).limit(1)

    if (t) {
      let toEmail = t.contactEmail ?? null
      let recipientName = t.externalCompany ?? 'Recruteur'
      let companyName = t.externalCompany ?? ''
      if (t.companyId) {
        const [co] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, t.companyId)).limit(1)
        if (co) companyName = co.name
      }
      if (!toEmail) {
        const [r] = await db.select({ fullName: profiles.fullName, email: profiles.email })
          .from(profiles).where(eq(profiles.id, t.recruiterId)).limit(1)
        if (r) { toEmail = r.email; recipientName = r.fullName }
      }
      if (toEmail) {
        await sendApplicationDetail({
          kind: 'training', toEmail, recipientName, candidateId: userId,
          title: t.title, companyName, coverLetter: motivation ?? null,
        })
      }
    }
  } catch (e) {
    console.error('[training apply email]', e)
  }

  return NextResponse.json({ ok: true })
}
