import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: job } = await supabase
      .from('jobs')
      .select('title, company:companies(name), skills:job_skills(skill:skills(name))')
      .eq('id', jobId)
      .single()

    if (!job) return NextResponse.json({ error: 'Offre introuvable' }, { status: 404 })

    // Type-safe extraction
    const companyRaw = job.company as unknown
    const companyName = (companyRaw && typeof companyRaw === 'object' && 'name' in companyRaw)
      ? (companyRaw as { name: string }).name
      : "l'entreprise"

    const skillsRaw = job.skills as unknown[]
    const skills = skillsRaw
      ?.map((s) => {
        const row = s as Record<string, unknown>
        const skill = row.skill as { name?: string } | null
        return skill?.name
      })
      .filter(Boolean) as string[] ?? []

    const prompt = SYSTEM_PROMPTS.interviewPrep(job.title as string, companyName, skills)

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
