import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { and, desc, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  applications, conversations, interviews, messages, profiles,
} from '@/lib/db/schema'
import {
  interviewInviteEmail,
  applicationWithdrawnEmail,
  applicationStatusEmail,
  welcomeEmail,
  newMessageEmail,
  joinRequestEmail,
  joinResponseEmail,
  teamInvitationEmail,
  type ApplicationStatus,
} from '@/lib/email/templates'
import { sendApplicationDetail } from '@/lib/email/sendApplication'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'Kazajob <contact@velt.re>'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type } = body

    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // ── Entretien (invitation / rappel) ────────────────────────────
    if (type === 'interview_invite' || type === 'interview_reminder') {
      const { interviewId, recipient } = body
      const interview = await db.query.interviews.findFirst({
        where: eq(interviews.id, interviewId),
        with: {
          candidate: { columns: { fullName: true, email: true } },
          recruiter: { columns: { fullName: true, email: true } },
          job: { columns: { title: true }, with: { company: { columns: { name: true } } } },
        },
      })
      if (!interview) return NextResponse.json({ error: 'Entretien introuvable' }, { status: 404 })

      const cand = (interview as { candidate: { fullName: string; email: string } }).candidate
      const recr = (interview as { recruiter: { fullName: string; email: string } }).recruiter
      const job  = (interview as { job?: { title: string; company?: { name: string } } }).job

      const emailData = {
        candidateName: cand.fullName,
        recruiterName: recr.fullName,
        companyName:   job?.company?.name ?? "l'entreprise",
        jobTitle:      job?.title ?? 'Poste non précisé',
        scheduledAt:   interview.scheduledAt,
        durationMin:   interview.durationMin,
        type:          interview.type as 'video' | 'phone' | 'onsite',
        visioLink:     interview.visioLink,
        location:      interview.location,
        notes:         interview.notes,
        isReminder:    type === 'interview_reminder',
      }
      const to = recipient === 'candidate' ? cand.email : recr.email
      const { subject, html } = interviewInviteEmail(emailData, recipient)
      const { error } = await resend.emails.send({ from: FROM, to, subject, html })
      if (error) throw new Error(error.message)

      if (type === 'interview_reminder') {
        await db.update(interviews).set({ reminderSent: true }).where(eq(interviews.id, interviewId))
      }
      return NextResponse.json({ ok: true })
    }

    // ── Candidature retirée (→ recruteur) ──────────────────────────
    if (type === 'application_withdrawn') {
      const { applicationId } = body
      const app = await db.query.applications.findFirst({
        where: eq(applications.id, applicationId),
        with: {
          candidate: { columns: { fullName: true } },
          job: { columns: { title: true, recruiterId: true }, with: { company: { columns: { name: true } } } },
        },
      })
      if (!app) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })
      const job = (app as { job: { title: string; recruiterId: string } }).job
      const cand = (app as { candidate: { fullName: string } }).candidate

      const [recruiter] = await db.select({ fullName: profiles.fullName, email: profiles.email })
        .from(profiles).where(eq(profiles.id, job.recruiterId)).limit(1)
      if (!recruiter) return NextResponse.json({ ok: true })

      const { subject, html } = applicationWithdrawnEmail({
        recruiterName: recruiter.fullName, candidateName: cand.fullName, jobTitle: job.title,
      })
      await resend.emails.send({ from: FROM, to: recruiter.email, subject, html })
      return NextResponse.json({ ok: true })
    }

    // ── Bienvenue ──────────────────────────────────────────────────
    if (type === 'welcome') {
      const { email: to, fullName, role } = body
      if (!to || !fullName) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
      // Anti-spam : on n'envoie le mail de bienvenue qu'à sa propre adresse.
      if (session.user.email && to !== session.user.email) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      }
      const { subject, html } = welcomeEmail({ fullName, role: role ?? 'candidate' })
      const { error } = await resend.emails.send({ from: FROM, to, subject, html })
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true })
    }

    // ── Nouvelle candidature (→ recruteur ou contact externe) ──────
    if (type === 'new_application') {
      const { applicationId } = body
      const app = await db.query.applications.findFirst({
        where: eq(applications.id, applicationId),
        columns: { coverLetter: true, candidateId: true, prequalAnswers: true },
        with: {
          job: { columns: { title: true, recruiterId: true, contactEmail: true, externalCompany: true }, with: { company: { columns: { name: true } } } },
        },
      })
      if (!app) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })
      const a = app as typeof app & {
        candidateId: string; prequalAnswers: { label: string; value: string }[] | null
        job: { title: string; recruiterId: string; contactEmail: string | null; externalCompany: string | null; company?: { name: string } | null }
      }

      // Annonce externe (admin) → email de contact ; sinon recruteur.
      let toEmail = a.job.contactEmail ?? null
      let recipientName = a.job.externalCompany ?? 'Recruteur'
      if (!toEmail) {
        const [recruiter] = await db.select({ fullName: profiles.fullName, email: profiles.email })
          .from(profiles).where(eq(profiles.id, a.job.recruiterId)).limit(1)
        if (!recruiter) return NextResponse.json({ ok: true })
        toEmail = recruiter.email; recipientName = recruiter.fullName
      }

      await sendApplicationDetail({
        kind: 'job', toEmail, recipientName, candidateId: a.candidateId,
        title: a.job.title, companyName: a.job.company?.name ?? a.job.externalCompany ?? '',
        coverLetter: a.coverLetter, prequal: a.prequalAnswers ?? [],
      })
      return NextResponse.json({ ok: true })
    }

    // ── Changement de statut (→ candidat) ──────────────────────────
    if (type === 'application_status') {
      const { applicationId, status } = body
      const app = await db.query.applications.findFirst({
        where: eq(applications.id, applicationId),
        with: {
          candidate: { columns: { fullName: true, email: true, emailAlertsEnabled: true } },
          job: { columns: { title: true }, with: { company: { columns: { name: true } } } },
        },
      })
      if (!app) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })
      const cand = (app as { candidate: { fullName: string; email: string; emailAlertsEnabled: boolean } }).candidate
      const job = (app as { job: { title: string; company?: { name: string } } }).job

      if (!cand.emailAlertsEnabled) return NextResponse.json({ ok: true, skipped: 'alerts disabled' })
      const valid: ApplicationStatus[] = ['viewed', 'interview', 'offer', 'hired', 'rejected']
      if (!valid.includes(status)) return NextResponse.json({ ok: true })

      const { subject, html } = applicationStatusEmail({
        candidateName: cand.fullName, jobTitle: job.title,
        companyName: job.company?.name ?? 'Entreprise', status,
      })
      await resend.emails.send({ from: FROM, to: cand.email, subject, html })
      return NextResponse.json({ ok: true })
    }

    // ── Nouveau message ────────────────────────────────────────────
    if (type === 'new_message') {
      const { conversationId, senderId } = body
      const conv = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
        columns: { candidateId: true, recruiterId: true },
        with: { job: { columns: { title: true } } },
      })
      if (!conv) return NextResponse.json({ ok: true })

      const recipientId = senderId === conv.candidateId ? conv.recruiterId : conv.candidateId
      const isRecruiter = senderId === conv.candidateId

      const [[sender], [recipient]] = await Promise.all([
        db.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.id, senderId)).limit(1),
        db.select({ fullName: profiles.fullName, email: profiles.email, emailAlertsEnabled: profiles.emailAlertsEnabled })
          .from(profiles).where(eq(profiles.id, recipientId)).limit(1),
      ])
      if (!recipient || !recipient.emailAlertsEnabled) return NextResponse.json({ ok: true })

      const [lastMsg] = await db.select({ content: messages.content }).from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt)).limit(1)

      const { subject, html } = newMessageEmail({
        recipientName: recipient.fullName,
        senderName: sender?.fullName ?? 'Un utilisateur',
        messagePreview: lastMsg?.content ?? '',
        jobTitle: (conv as { job?: { title?: string } }).job?.title ?? undefined,
        role: isRecruiter ? 'recruiter' : 'candidate',
      })
      await resend.emails.send({ from: FROM, to: recipient.email, subject, html })
      return NextResponse.json({ ok: true })
    }

    // ── Demande d'adhésion (→ owner) ───────────────────────────────
    if (type === 'join_request') {
      const { requestId } = body
      const jr = await db.query.companyJoinRequests.findFirst({
        where: (t, { eq: e }) => e(t.id, requestId),
        columns: { message: true },
        with: {
          profile: { columns: { fullName: true, email: true } },
          company: { columns: { name: true, ownerId: true } },
        },
      })
      if (!jr) return NextResponse.json({ ok: true })
      const requester = (jr as { profile: { fullName: string; email: string } }).profile
      const company = (jr as { company: { name: string; ownerId: string | null } }).company
      if (!company.ownerId) return NextResponse.json({ ok: true })

      const [owner] = await db.select({ fullName: profiles.fullName, email: profiles.email })
        .from(profiles).where(eq(profiles.id, company.ownerId)).limit(1)
      if (!owner) return NextResponse.json({ ok: true })

      const { subject, html } = joinRequestEmail({
        ownerName: owner.fullName, companyName: company.name,
        requesterName: requester.fullName, requesterEmail: requester.email, message: jr.message,
      })
      await resend.emails.send({ from: FROM, to: owner.email, subject, html })
      return NextResponse.json({ ok: true })
    }

    // ── Réponse à une demande (→ recruteur) ────────────────────────
    if (type === 'join_response') {
      const { requestId, approved } = body
      const jr = await db.query.companyJoinRequests.findFirst({
        where: (t, { eq: e }) => e(t.id, requestId),
        with: {
          profile: { columns: { fullName: true, email: true } },
          company: { columns: { name: true } },
        },
      })
      if (!jr) return NextResponse.json({ ok: true })
      const requester = (jr as { profile: { fullName: string; email: string } }).profile
      const company = (jr as { company: { name: string } }).company

      const { subject, html } = joinResponseEmail({
        recruiterName: requester.fullName, companyName: company.name, approved: !!approved,
      })
      await resend.emails.send({ from: FROM, to: requester.email, subject, html })
      return NextResponse.json({ ok: true })
    }

    // ── Invitation équipe (→ invité par e-mail) ────────────────────
    if (type === 'team_invitation') {
      const { token } = body
      const inv = await db.query.companyInvitations.findFirst({
        where: (t, { eq: e }) => e(t.token, token),
        with: { company: { columns: { name: true } } },
      })
      if (!inv || !inv.email) return NextResponse.json({ ok: true })

      const [inviter] = inv.invitedBy
        ? await db.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.id, inv.invitedBy)).limit(1)
        : [undefined]

      const { subject, html } = teamInvitationEmail({
        inviterName: inviter?.fullName ?? 'Un recruteur',
        companyName: (inv as { company?: { name: string } }).company?.name ?? 'une entreprise',
        role: inv.role === 'admin' ? 'admin' : 'member',
        acceptUrl: `https://kazajob.re/recruiter/join?invite=${token}`,
      })
      await resend.emails.send({ from: FROM, to: inv.email, subject, html })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Type inconnu' }, { status: 400 })
  } catch (err) {
    console.error('[Email API]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}
