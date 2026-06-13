import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getApplicationAIContext } from '@/lib/queries/applications'
import { generateText } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts'

// Synthèse de candidature : réservée aux abonnements Business (3) et Entreprise (4)
const ALLOWED_PLANS = ['business', 'enterprise']
const ALLOWED_STATUS = ['trial', 'active', 'past_due']

export async function POST(req: NextRequest) {
  try {
    const { applicationId } = await req.json()

    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const ctx = await getApplicationAIContext(applicationId)
    if (!ctx) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })

    // Autorisation : seul le recruteur propriétaire de l'offre
    if (ctx.recruiter_id !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Contrôle d'abonnement : plans 3 & 4 uniquement, abonnement actif/essai
    const planOk = !!ctx.plan_id && ALLOWED_PLANS.includes(ctx.plan_id)
      && !!ctx.sub_status && ALLOWED_STATUS.includes(ctx.sub_status)
    if (!planOk) {
      return NextResponse.json(
        { error: 'plan', message: 'La synthèse IA des candidatures est réservée aux abonnements Business et Entreprise.' },
        { status: 402 },
      )
    }

    const prompt = SYSTEM_PROMPTS.applicationSummary({
      job: ctx.job,
      candidate: {
        fullName: ctx.candidate.full_name,
        location: ctx.candidate.location,
        bio: ctx.candidate.bio,
        skills: ctx.candidate.skills,
        softSkills: ctx.candidate.soft_skills,
      },
      coverLetter: ctx.cover_letter,
    })

    const raw = await generateText(
      [
        { role: 'system', content: prompt },
        { role: 'user',   content: 'Analyse cette candidature maintenant.' },
      ],
      { maxTokens: 1200, temperature: 0.4 },
    )

    let summary: unknown = null
    try {
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      summary = start >= 0 && end > start ? JSON.parse(raw.slice(start, end + 1)) : null
    } catch {
      summary = null
    }

    if (!summary) return NextResponse.json({ summary: null, raw })
    return NextResponse.json({ summary })

  } catch (err) {
    console.error('[KazaIA application-summary]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
