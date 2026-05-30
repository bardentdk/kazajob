/**
 * KAZAJOB — Cron Job Alerts
 * Déclenché par Vercel Cron à 04:00 UTC (08:00 Réunion UTC+4)
 * Envoie les alertes emploi aux candidats ayant activé les notifications
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { jobAlertEmail, type JobAlertItem } from '@/lib/email/templates'
import { formatSalary } from '@/lib/utils'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM ?? 'Kazajob <contact@velt.re>'

export async function GET(req: NextRequest) {
  // Protection : Vercel envoie automatiquement le header Authorization
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // ── Candidats avec alertes activées ─────────────────────────
    const { data: candidates } = await supabase
      .from('profiles')
      .select('id, full_name, email, email_alert_frequency')
      .eq('role', 'candidate')
      .eq('email_alerts_enabled', true)
      .not('email', 'is', null)

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    const now         = new Date()
    const dayAgo      = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo     = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
    const isMonday    = now.getDay() === 1   // Alertes weekly uniquement le lundi

    // ── Nouvelles offres : dernières 24h ──────────────────────────
    const { data: recentJobs } = await supabase
      .from('jobs')
      .select('id, title, location, job_type, salary_min, salary_max, company:companies(name)')
      .eq('is_active', true)
      .gte('created_at', dayAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    // ── Offres 7 derniers jours (pour weekly) ─────────────────────
    const { data: weeklyJobs } = isMonday ? await supabase
      .from('jobs')
      .select('id, title, location, job_type, salary_min, salary_max, company:companies(name)')
      .eq('is_active', true)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20)
    : { data: null }

    const toAlertItem = (job: {
      id: string; title: string; location: string; job_type: string
      salary_min: number | null; salary_max: number | null
      company: { name: string } | null
    }): JobAlertItem => ({
      id:       job.id,
      title:    job.title,
      company:  job.company?.name ?? 'Entreprise',
      location: job.location,
      job_type: job.job_type,
      salary:   formatSalary(job.salary_min, job.salary_max),
    })

    let sent = 0
    const errors: string[] = []

    for (const candidate of candidates) {
      try {
        const freq  = candidate.email_alert_frequency as 'instant' | 'daily' | 'weekly'
        let jobs: JobAlertItem[] | null = null

        if (freq === 'instant' || freq === 'daily') {
          if (recentJobs && recentJobs.length > 0) {
            jobs = (recentJobs as unknown as Parameters<typeof toAlertItem>[0][]).map(toAlertItem)
          }
        } else if (freq === 'weekly' && isMonday) {
          if (weeklyJobs && weeklyJobs.length > 0) {
            jobs = (weeklyJobs as unknown as Parameters<typeof toAlertItem>[0][]).map(toAlertItem)
          }
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
