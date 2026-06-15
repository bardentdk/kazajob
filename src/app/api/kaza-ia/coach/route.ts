import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { profiles, candidateSkills, skills } from '@/lib/db/schema'
import { generateText } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts'

// POST /api/kaza-ia/coach  { targetRole? } → { coach } | { raw }
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { targetRole } = await req.json().catch(() => ({}))

    const [me] = await db
      .select({ fullName: profiles.fullName, bio: profiles.bio, location: profiles.location, softSkills: profiles.softSkills })
      .from(profiles).where(eq(profiles.id, userId)).limit(1)
    if (!me) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

    const cs = await db
      .select({ name: skills.name })
      .from(candidateSkills)
      .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
      .where(eq(candidateSkills.candidateId, userId))

    const prompt = SYSTEM_PROMPTS.kazaCoach({
      name: me.fullName || 'candidat',
      bio: me.bio,
      location: me.location,
      skills: cs.map((s) => s.name),
      softSkills: me.softSkills ?? [],
      targetRole: targetRole ? String(targetRole).slice(0, 120) : null,
    })

    const raw = await generateText(
      [
        { role: 'system', content: prompt },
        { role: 'user',   content: 'Analyse mon profil et coache-moi maintenant.' },
      ],
      { maxTokens: 1300, temperature: 0.6 },
    )

    let coach: unknown = null
    try {
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      coach = start >= 0 && end > start ? JSON.parse(raw.slice(start, end + 1)) : null
    } catch { coach = null }

    if (!coach) return NextResponse.json({ coach: null, raw })
    return NextResponse.json({ coach })

  } catch (err) {
    console.error('[KazaCoach]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
