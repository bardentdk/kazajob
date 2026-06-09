import { NextRequest, NextResponse } from 'next/server'
import { auth, getCurrentUser } from '@/lib/auth'
import { getCandidateSkills } from '@/lib/queries/profiles'
import { getJobAIContext } from '@/lib/queries/jobs'
import { generateText } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  try {
    const { jobId, tone = 'professional' } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: 'jobId requis' }, { status: 400 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const profile = await getCurrentUser()
    const skills = (await getCandidateSkills(session.user.id)).map((s) => s.name)
    const job = await getJobAIContext(jobId)

    if (!job) {
      return NextResponse.json({ error: 'Offre introuvable' }, { status: 404 })
    }

    // Construire les messages
    const systemPrompt = SYSTEM_PROMPTS.coverLetter(
      {
        name:     profile?.fullName ?? 'Le candidat',
        bio:      profile?.bio,
        location: profile?.location,
        skills,
      },
      {
        title:       job.title,
        company:     job.company_name,
        description: job.description,
        location:    job.location,
        jobType:     job.job_type,
      }
    )

    // Tonalité ajustable
    const userPrompt = tone === 'creative'
      ? 'Génère une lettre de motivation avec une accroche originale et créative.'
      : tone === 'concise'
        ? 'Génère une lettre de motivation courte et percutante (200 mots max).'
        : 'Génère une lettre de motivation professionnelle et efficace.'

    const letter = await generateText(
      [
        { role: 'system',    content: systemPrompt },
        { role: 'user',      content: userPrompt },
      ],
      { maxTokens: 1024, temperature: 0.75 }
    )

    return NextResponse.json({ letter, model: process.env.AI_PROVIDER ?? 'groq' })

  } catch (err) {
    console.error('[KazaIA cover-letter]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
