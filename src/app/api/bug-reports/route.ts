import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { Resend } from 'resend'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bugReports, profiles } from '@/lib/db/schema'
import { bugReportEmail } from '@/lib/email/templates'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'kazajob.re@gmail.com'
const FROM = process.env.RESEND_FROM ?? 'Kazajob <contact@velt.re>'

// POST /api/bug-reports  { page, message, attachmentUrl?, severity? }
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { page, message, attachmentUrl, severity } = await req.json().catch(() => ({}))
  if (!message?.trim()) return NextResponse.json({ error: 'Message requis' }, { status: 400 })

  const [me] = await db
    .select({ name: profiles.fullName, email: profiles.email, role: profiles.role })
    .from(profiles).where(eq(profiles.id, userId)).limit(1)

  const sev = severity === 'critical' ? 'critical' : 'normal'
  const safePage = String(page ?? '').slice(0, 300) || 'Non précisée'

  const [row] = await db.insert(bugReports).values({
    reporterId: userId,
    reporterName: me?.name ?? null,
    reporterEmail: me?.email ?? null,
    reporterRole: me?.role ?? null,
    page: safePage,
    message: String(message).slice(0, 4000),
    attachmentUrl: attachmentUrl ? String(attachmentUrl).slice(0, 1000) : null,
    severity: sev,
  }).returning({ id: bugReports.id })

  // Email à l'admin (fire & forget — l'échec d'envoi ne bloque pas le report).
  try {
    if (process.env.RESEND_API_KEY) {
      const { subject, html } = bugReportEmail({
        reporterName: me?.name ?? 'Utilisateur',
        reporterEmail: me?.email ?? '—',
        reporterRole: me?.role ?? 'candidate',
        page: safePage,
        message: String(message).slice(0, 4000),
        severity: sev,
        attachmentUrl: attachmentUrl ?? null,
      })
      await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM, to: ADMIN_EMAIL, subject, html })
    }
  } catch (e) {
    console.error('[bug-report email]', e)
  }

  return NextResponse.json({ ok: true, id: row.id })
}
