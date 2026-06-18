/**
 * Envoi de l'email de candidature détaillée au recruteur (ou contact externe
 * pour les annonces créées par l'admin). Récupère le profil complet du candidat.
 */
import { Resend } from 'resend'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { profiles, candidateSkills, skills } from '@/lib/db/schema'
import { applicationDetailEmail } from '@/lib/email/templates'

const FROM = process.env.RESEND_FROM ?? 'Kazajob <contact@velt.re>'

export async function sendApplicationDetail(opts: {
  kind: 'job' | 'training'
  toEmail: string
  recipientName: string
  candidateId: string
  title: string
  companyName: string
  coverLetter?: string | null
  prequal?: { label: string; value: string }[]
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || !opts.toEmail) return

  const [me] = await db.select({
    fullName: profiles.fullName, email: profiles.email, phone: profiles.phone, location: profiles.location,
    bio: profiles.bio, cvUrl: profiles.cvUrl, linkedin: profiles.linkedinUrl, github: profiles.githubUrl,
    portfolio: profiles.portfolioUrl, portfolioPdf: profiles.portfolioPdfUrl,
  }).from(profiles).where(eq(profiles.id, opts.candidateId)).limit(1)
  if (!me) return

  const cs = await db.select({ name: skills.name }).from(candidateSkills)
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .where(eq(candidateSkills.candidateId, opts.candidateId))

  const { subject, html } = applicationDetailEmail({
    kind: opts.kind,
    recipientName: opts.recipientName,
    title: opts.title,
    companyName: opts.companyName,
    candidate: {
      name: me.fullName, email: me.email, phone: me.phone, location: me.location, bio: me.bio,
      skills: cs.map((s) => s.name),
      cvUrl: me.cvUrl, linkedin: me.linkedin, github: me.github, portfolio: me.portfolio, portfolioPdf: me.portfolioPdf,
    },
    coverLetter: opts.coverLetter,
    prequal: opts.prequal,
  })

  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM, to: opts.toEmail, subject, html })
  } catch (e) {
    console.error('[sendApplicationDetail]', e)
  }
}
