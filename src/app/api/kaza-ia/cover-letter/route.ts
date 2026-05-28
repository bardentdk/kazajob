import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  try {
    const { jobId, tone = 'professional' } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: 'jobId requis' }, { status: 400 })
    }

    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le profil candidat
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, bio, location')
      .eq('id', user.id)
      .single()

    // Récupérer les compétences du candidat
    const { data: candidateSkills } = await supabase
      .from('candidate_skills')
      .select('skill:skills(name)')
      .eq('candidate_id', user.id)

    const skills = (candidateSkills ?? []).map((cs: Record<string, unknown>) => {
      const skill = cs.skill as { name?: string } | null
      return skill?.name
    }).filter(Boolean) as string[]

    // Récupérer l'offre
    const { data: job } = await supabase
      .from('jobs')
      .select('title, description, location, job_type, company:companies(name)')
      .eq('id', jobId)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Offre introuvable' }, { status: 404 })
    }

    const companyRaw = job.company as unknown
    const companyName = (companyRaw && typeof companyRaw === 'object' && 'name' in companyRaw)
      ? (companyRaw as { name: string }).name
      : "l'entreprise"

    // Construire les messages
    const systemPrompt = SYSTEM_PROMPTS.coverLetter(
      {
        name:     profile?.full_name ?? 'Le candidat',
        bio:      profile?.bio,
        location: profile?.location,
        skills,
      },
      {
        title:       job.title,
        company:     companyName,
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
