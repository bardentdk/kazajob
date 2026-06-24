/**
 * KAZAJOB — Cron Relances fin d'essai
 * Déclenché par Vercel Cron à 05:00 UTC (09:00 Réunion UTC+4).
 * Envoie une relance email aux paliers J-15, J-7, J-3 et J0 avant la fin d'essai.
 * Idempotent : `last_trial_reminder` mémorise le dernier palier envoyé.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { listTrialsForReminder, setTrialReminder } from '@/lib/queries/billing'
import { processLaunchReminders } from '@/lib/queries/launch'
import { trialReminderEmail } from '@/lib/email/templates'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM ?? 'Kazajob <contact@velt.re>'

// Détermine le palier de relance applicable à partir des jours restants.
function reminderThreshold(daysLeft: number): number | null {
  if (daysLeft <= 0) return 0
  if (daysLeft <= 3) return 3
  if (daysLeft <= 7) return 7
  if (daysLeft <= 15) return 15
  return null
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const trials = await listTrialsForReminder()
    let sent = 0
    const errors: string[] = []

    for (const t of trials) {
      try {
        const daysLeft = Math.ceil((t.trialEndsAt.getTime() - Date.now()) / 86_400_000)
        const threshold = reminderThreshold(daysLeft)
        if (threshold === null) continue

        // Idempotence : un seul envoi par palier, dans l'ordre décroissant (15 → 7 → 3 → 0).
        if (t.lastTrialReminder !== null && threshold >= t.lastTrialReminder) continue

        const plan = SUBSCRIPTION_PLANS.find((p) => p.id === t.planId)
        if (!plan) continue

        const { subject, html } = trialReminderEmail({
          companyName: t.companyName,
          ownerName:   t.ownerName || 'cher recruteur',
          planName:    plan.name,
          priceEur:    `${Math.round(plan.priceCts / 100)} €`,
          daysLeft:    threshold,
          trialEndsAt: t.trialEndsAt,
        })

        await resend.emails.send({ from: FROM, to: t.ownerEmail, subject, html })
        await setTrialReminder(t.subId, threshold)
        sent++
        await new Promise((r) => setTimeout(r, 100))   // rate limit Resend

      } catch (e) {
        errors.push(`${t.ownerEmail}: ${e instanceof Error ? e.message : 'erreur'}`)
      }
    }

    // Rappels d'expiration KazaLaunch (in-app, idempotents, J-30/15/7/3/1/0).
    const launchReminders = await processLaunchReminders()

    console.log(`[Trial Reminders Cron] Email: ${sent} / KazaLaunch: ${launchReminders} / Erreurs: ${errors.length}`)
    return NextResponse.json({ ok: true, sent, launchReminders, errors: errors.length > 0 ? errors : undefined })

  } catch (err) {
    console.error('[Trial Reminders Cron]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}
