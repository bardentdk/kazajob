import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/provider'

// GET /api/ai/salary-estimate?sector=…&job_type=…&title=…
// Renvoie { min, max, median, source: 'ia' } ou null
export async function GET(req: NextRequest) {
  const sector   = req.nextUrl.searchParams.get('sector') ?? ''
  const job_type = req.nextUrl.searchParams.get('job_type') ?? 'CDI'
  const title    = req.nextUrl.searchParams.get('title') ?? ''

  if (!sector && !title) return NextResponse.json(null)

  const prompt = `Tu es expert du marché de l'emploi à La Réunion (974) et Mayotte (976).
Estime une fourchette salariale RÉALISTE pour ce poste, en tenant compte du marché local DOM (salaires généralement inférieurs à la métropole de 10-20%).

Poste : ${title || sector}
Type de contrat : ${job_type}
Secteur : ${sector || 'Non précisé'}
Lieu : La Réunion 974

Réponds UNIQUEMENT avec un objet JSON (aucun texte autour) :
{"min": <brut annuel min>, "max": <brut annuel max>, "median": <médiane>}

Exemples réalistes 974 (brut annuel) :
- Caissier CDI : {"min":18000,"max":21000,"median":19500}
- Développeur web junior CDI : {"min":22000,"max":28000,"median":24000}
- Infirmier CDI : {"min":26000,"max":35000,"median":29000}
- Directeur commercial CDI : {"min":40000,"max":58000,"median":47000}
- Agent de sécurité CDI : {"min":19000,"max":23000,"median":21000}`

  try {
    const raw = await generateText(
      [{ role: 'user', content: prompt }],
      { maxTokens: 80, temperature: 0.2 },
    )
    const match = raw.match(/\{[^}]+\}/)
    if (!match) return NextResponse.json(null)
    const json = JSON.parse(match[0]) as { min?: number; max?: number; median?: number }
    if (!json.min || !json.max) return NextResponse.json(null)
    return NextResponse.json({ min: json.min, max: json.max, median: json.median ?? Math.round((json.min + json.max) / 2), source: 'ia' })
  } catch {
    return NextResponse.json(null)
  }
}
