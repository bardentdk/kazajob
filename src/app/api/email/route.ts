import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import {
  interviewInviteEmail,
  applicationWithdrawnEmail,
  applicationStatusEmail,
  welcomeEmail,
  newApplicationEmail,
  newMessageEmail,
  joinRequestEmail,
  joinResponseEmail,
  type ApplicationStatus,
} from '@/lib/email/templates'

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

    // ── Welcome ────────────────────────────────────────────────────
    if (type === 'welcome') {
      const { email: to, fullName, role } = body
      if (!to || !fullName) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
      const { subject, html } = welcomeEmail({ fullName, role: role ?? 'candidate' })
      const { error } = await resend.emails.send({ from: FROM, to, subject, html })
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true })
    }

    // ── Nouvelle candidature (→ recruteur) ─────────────────────────
    if (type === 'new_application') {
      const { applicationId } = body
      const { data: app } = await supabase
        .from('applications')
        .select(`
          id, cover_letter,
          candidate:profiles!candidate_id(full_name, email),
          job:jobs!inner(title, recruiter_id, company:companies(name))
        `)
        .eq('id', applicationId)
        .single()

      if (!app) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })

      const candidate = app.candidate as unknown as { full_name: string; email: string }
      const job       = app.job       as unknown as { title: string; recruiter_id: string; company?: { name: string } }

      const { data: recruiter } = await supabase
        .from('profiles').select('full_name, email').eq('id', job.recruiter_id).single()
      if (!recruiter) return NextResponse.json({ ok: true })

      const { subject, html } = newApplicationEmail({
        recruiterName:  recruiter.full_name,
        candidateName:  candidate.full_name,
        candidateEmail: candidate.email,
        jobTitle:       job.title,
        companyName:    job.company?.name ?? 'Votre entreprise',
        applicationId,
        hasCoverLetter: !!(app.cover_letter),
      })
      await resend.emails.send({ from: FROM, to: recruiter.email, subject, html })
      return NextResponse.json({ ok: true })
    }

    // ── Changement statut candidature (→ candidat) ─────────────────
    if (type === 'application_status') {
      const { applicationId, status } = body
      const { data: app } = await supabase
        .from('applications')
        .select(`
          candidate:profiles!candidate_id(full_name, email, email_alerts_enabled),
          job:jobs!inner(title, company:companies(name))
        `)
        .eq('id', applicationId)
        .single()

      if (!app) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })

      const candidate = app.candidate as unknown as { full_name: string; email: string; email_alerts_enabled: boolean }
      const job       = app.job       as unknown as { title: string; company?: { name: string } }

      if (!candidate.email_alerts_enabled) return NextResponse.json({ ok: true, skipped: 'alerts disabled' })

      const validStatuses: ApplicationStatus[] = ['viewed','interview','offer','hired','rejected']
      if (!validStatuses.includes(status)) return NextResponse.json({ ok: true })

      const { subject, html } = applicationStatusEmail({
        candidateName: candidate.full_name,
        jobTitle:      job.title,
        companyName:   job.company?.name ?? 'Entreprise',
        status,
      })
      await resend.emails.send({ from: FROM, to: candidate.email, subject, html })
      return NextResponse.json({ ok: true })
    }

    // ── Nouveau message ────────────────────────────────────────────
    if (type === 'new_message') {
      const { conversationId, senderId } = body
      const { data: conv } = await supabase
        .from('conversations')
        .select('candidate_id, recruiter_id, job:jobs(title)')
        .eq('id', conversationId)
        .single()

      if (!conv) return NextResponse.json({ ok: true })

      const recipientId = senderId === conv.candidate_id ? conv.recruiter_id : conv.candidate_id
      const isRecruiter = senderId === conv.candidate_id

      const [{ data: sender }, { data: recipient }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', senderId).single(),
        supabase.from('profiles').select('full_name, email, email_alerts_enabled').eq('id', recipientId).single(),
      ])

      if (!recipient || !recipient.email_alerts_enabled) return NextResponse.json({ ok: true })

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const { subject, html } = newMessageEmail({
        recipientName:  recipient.full_name,
        senderName:     sender?.full_name ?? 'Un utilisateur',
        messagePreview: lastMsg?.content ?? '',
        jobTitle:       (conv.job as { title?: string } | null)?.title ?? undefined,
        role:           isRecruiter ? 'recruiter' : 'candidate',
      })
      await resend.emails.send({ from: FROM, to: recipient.email, subject, html })
      return NextResponse.json({ ok: true })
    }

    // ── Demande rejoindre équipe (→ owner) ─────────────────────────
    if (type === 'join_request') {
      const { requestId } = body
      const { data: req } = await supabase
        .from('company_join_requests')
        .select(`
          message,
          requester:profiles!recruiter_id(full_name, email),
          company:companies!company_id(name, owner_id)
        `)
        .eq('id', requestId)
        .single()

      if (!req) return NextResponse.json({ ok: true })

      const requester = req.requester as unknown as { full_name: string; email: string }
      const company   = req.company   as unknown as { name: string; owner_id: string }

      const { data: owner } = await supabase
        .from('profiles').select('full_name, email').eq('id', company.owner_id).single()
      if (!owner) return NextResponse.json({ ok: true })

      const { subject, html } = joinRequestEmail({
        ownerName:      owner.full_name,
        companyName:    company.name,
        requesterName:  requester.full_name,
        requesterEmail: requester.email,
        message:        req.message,
      })
      await resend.emails.send({ from: FROM, to: owner.email, subject, html })
      return NextResponse.json({ ok: true })
    }

    // ── Réponse demande adhésion (→ recruteur) ─────────────────────
    if (type === 'join_response') {
      const { requestId, approved } = body
      const { data: req } = await supabase
        .from('company_join_requests')
        .select(`
          requester:profiles!recruiter_id(full_name, email),
          company:companies!company_id(name)
        `)
        .eq('id', requestId)
        .single()

      if (!req) return NextResponse.json({ ok: true })

      const requester = req.requester as unknown as { full_name: string; email: string }
      const company   = req.company   as unknown as { name: string }

      const { subject, html } = joinResponseEmail({
        recruiterName: requester.full_name,
        companyName:   company.name,
        approved:      !!approved,
      })
      await resend.emails.send({ from: FROM, to: requester.email, subject, html })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Type inconnu' }, { status: 400 })

  } catch (err) {
    console.error('[Email API]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}
