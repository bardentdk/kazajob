import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { interviewInviteEmail, applicationWithdrawnEmail } from '@/lib/email/templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'Kazajob <contact@velt.re>'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    if (type === 'interview_invite' || type === 'interview_reminder') {
      const { interviewId, recipient } = body

      const { data: interview } = await supabase
        .from('interviews')
        .select(`
          *,
          candidate:profiles!candidate_id(full_name, email),
          recruiter:profiles!recruiter_id(full_name, email),
          job:jobs(title, company:companies(name))
        `)
        .eq('id', interviewId)
        .single()

      if (!interview) return NextResponse.json({ error: 'Entretien introuvable' }, { status: 404 })

      const candidateProfile = interview.candidate as { full_name: string; email: string }
      const recruiterProfile  = interview.recruiter  as { full_name: string; email: string }
      const jobData           = interview.job        as { title: string; company?: { name: string } }

      const emailData = {
        candidateName: candidateProfile.full_name,
        recruiterName:  recruiterProfile.full_name,
        companyName:   jobData?.company?.name ?? 'l\'entreprise',
        jobTitle:      jobData?.title ?? 'Poste non précisé',
        scheduledAt:   new Date(interview.scheduled_at),
        durationMin:   interview.duration_min,
        type:          interview.type as 'video' | 'phone' | 'onsite',
        visioLink:     interview.visio_link,
        location:      interview.location,
        notes:         interview.notes,
        isReminder:    type === 'interview_reminder',
      }

      const to = recipient === 'candidate' ? candidateProfile.email : recruiterProfile.email
      const { subject, html } = interviewInviteEmail(emailData, recipient)

      const { error } = await resend.emails.send({ from: FROM, to, subject, html })
      if (error) throw new Error(error.message)

      // Marquer reminder envoyé
      if (type === 'interview_reminder') {
        await supabase.from('interviews').update({ reminder_sent: true }).eq('id', interviewId)
      }

      return NextResponse.json({ ok: true })
    }

    if (type === 'application_withdrawn') {
      const { applicationId } = body

      const { data: app } = await supabase
        .from('applications')
        .select(`
          *,
          candidate:profiles!candidate_id(full_name),
          job:jobs!inner(title, recruiter_id, company:companies(name))
        `)
        .eq('id', applicationId)
        .single()

      if (!app) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })

      // Récupérer l'email du recruteur
      const { data: recruiter } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', (app.job as { recruiter_id: string }).recruiter_id)
        .single()

      if (!recruiter) return NextResponse.json({ ok: true }) // pas d'email → pas d'erreur

      const candidateProfile = app.candidate as { full_name: string }
      const jobData = app.job as { title: string }
      const { subject, html } = applicationWithdrawnEmail({
        recruiterName:  recruiter.full_name,
        candidateName: candidateProfile.full_name,
        jobTitle:      jobData.title,
      })

      await resend.emails.send({ from: FROM, to: recruiter.email, subject, html })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Type inconnu' }, { status: 400 })

  } catch (err) {
    console.error('[Email API]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}
