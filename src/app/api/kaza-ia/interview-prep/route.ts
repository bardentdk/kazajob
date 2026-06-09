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

    const prompt = SYSTEM_PROMPTS.interviewPrep(job.title, job.company_name, job.skills)

    const questions = await generateText(
      [
        { role: 'system', content: prompt },
        { role: 'user',   content: "Génère les questions d'entretien maintenant." },
      ],
      { maxTokens: 1500, temperature: 0.7 }
    )

    return NextResponse.json({ questions })

  } catch (err) {
    console.error('[KazaIA interview-prep]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
