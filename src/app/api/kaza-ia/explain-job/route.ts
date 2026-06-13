import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getJobAIContext } from '@/lib/queries/jobs'
import { generateText } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()

    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const job = await getJobAIContext(jobId)
    if (!job) return NextResponse.json({ error: 'Offre introuvable' }, { status: 404 })

    const prompt = SYSTEM_PROMPTS.explainJob({
      title: job.title,
      company: job.company_name,
      location: job.location,
      jobType: job.job_type,
      description: job.description,
      requirements: job.requirements,
      skills: job.skills,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
    })

    const raw = await generateText(
      [
        { role: 'system', content: prompt },
        { role: 'user',   content: "Explique cette offre maintenant." },
      ],
      { maxTokens: 1200, temperature: 0.5 }
    )

    // Parse JSON (avec fallback si le modèle ajoute du texte autour)
    let explain: unknown = null
    try {
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      explain = start >= 0 && end > start ? JSON.parse(raw.slice(start, end + 1)) : null
    } catch {
      explain = null
    }

    if (!explain) {
      // Fallback : renvoyer le texte brut pour affichage simple
      return NextResponse.json({ explain: null, raw })
    }

    return NextResponse.json({ explain })

  } catch (err) {
    console.error('[KazaIA explain-job]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
