/**
 * KAZAJOB — Cron Job Alerts
 * Déclenché par Vercel Cron à 04:00 UTC (08:00 Réunion UTC+4)
 * Envoie les alertes emploi aux candidats ayant activé les notifications
 */
import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, gte, isNotNull } from 'drizzle-orm'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { jobs as jobsTable, profiles } from '@/lib/db/schema'
import { jobAlertEmail, type JobAlertItem } from '@/lib/email/templates'
import { formatSalary } from '@/lib/utils'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM ?? 'Kazajob <contact@velt.re>'

export async function GET(req: NextRequest) {
  // Protection : Vercel envoie automatiquement le header Authorization
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ── Candidats avec alertes activées ─────────────────────────
    const candidates = await db
      .select({
        id: profiles.id,
        full_name: profiles.fullName,
        email: profiles.email,
        email_alert_frequency: profiles.emailAlertFrequency,
      })
      .from(profiles)
      .where(and(
        eq(profiles.role, 'candidate'),
        eq(profiles.emailAlertsEnabled, true),
        isNotNull(profiles.email),
      ))

    if (candidates.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    const now         = new Date()
    const dayAgo      = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo     = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
    const isMonday    = now.getDay() === 1   // Alertes weekly uniquement le lundi

    const jobsSince = (since: Date) => db.query.jobs.findMany({
      where: and(eq(jobsTable.isActive, true), gte(jobsTable.createdAt, since)),
      columns: { id: true, title: true, location: true, jobType: true, salaryMin: true, salaryMax: true },
      with: { company: { columns: { name: true } } },
      orderBy: (j, { desc: d }) => [d(j.createdAt)],
      limit: 20,
    })

    // ── Nouvelles offres : dernières 24h ──────────────────────────
    const recentJobs = await jobsSince(dayAgo)
    // ── Offres 7 derniers jours (pour weekly, lundi) ──────────────
    const weeklyJobs = isMonday ? await jobsSince(weekAgo) : null

    type JobRow = {
      id: string; title: string; location: string; jobType: string
      salaryMin: number | null; salaryMax: number | null
      company?: { name: string } | null
    }
    const toAlertItem = (job: JobRow): JobAlertItem => ({
      id:       job.id,
      title:    job.title,
      company:  job.company?.name ?? 'Entreprise',
      location: job.location,
      job_type: job.jobType,
      salary:   formatSalary(job.salaryMin, job.salaryMax),
    })

    let sent = 0
    const errors: string[] = []

    for (const candidate of candidates) {
      try {
        const freq  = candidate.email_alert_frequency as 'instant' | 'daily' | 'weekly'
        let jobs: JobAlertItem[] | null = null

        if (freq === 'instant' || freq === 'daily') {
          if (recentJobs.length > 0) jobs = (recentJobs as JobRow[]).map(toAlertItem)
        } else if (freq === 'weekly' && isMonday) {
          if (weeklyJobs && weeklyJobs.length > 0) jobs = (weeklyJobs as JobRow[]).map(toAlertItem)
        }

        if (!jobs || jobs.length === 0) continue

        const { subject, html } = jobAlertEmail({
          candidateName: candidate.full_name,
          jobs,
          frequency: freq,
        })

        await resend.emails.send({
          from: FROM,
          to:   candidate.email,
          subject,
          html,
        })

        sent++

        // Petite pause pour ne pas dépasser les rate limits Resend
        await new Promise(r => setTimeout(r, 100))

      } catch (e) {
        errors.push(`${candidate.email}: ${e instanceof Error ? e.message : 'erreur'}`)
      }
    }

    console.log(`[Job Alerts Cron] Envoyé: ${sent} / Erreurs: ${errors.length}`)
    return NextResponse.json({ ok: true, sent, errors: errors.length > 0 ? errors : undefined })

  } catch (err) {
    console.error('[Job Alerts Cron]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}
