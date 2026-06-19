import { NextRequest } from 'next/server'
import { auth, getCurrentUser } from '@/lib/auth'
import { getCandidateSkills } from '@/lib/queries/profiles'
import { streamText } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts'
import type { AIMessage } from '@/lib/ai/provider'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: 'Requête invalide' }), { status: 400 })
    }

    const rawMessages = body.messages as AIMessage[]
    const jobContext = body.jobContext as { title?: string; company?: string } | undefined

    // Limites anti-abus : max 20 échanges, max 4 000 chars par message
    if (rawMessages.length > 20) {
      return new Response(JSON.stringify({ error: 'Trop de messages' }), { status: 429 })
    }
    const VALID_ROLES = new Set(['user', 'assistant'])
    const messages = rawMessages
      .filter(m => VALID_ROLES.has(m.role))
      .map(m => ({ ...m, content: String(m.content ?? '').slice(0, 4000) }))

    // Auth (optionnelle pour le chat — enrichit le contexte si connecté)
    const session = await auth()

    let candidateContext: { name?: string; skills?: string[]; location?: string | null } = {}

    if (session?.user?.id) {
      const profile = await getCurrentUser()
      const skills = (await getCandidateSkills(session.user.id)).map((s) => s.name)
      candidateContext = {
        name:     profile?.fullName,
        location: profile?.location,
        skills,
      }
    }

    // Injecter le system prompt en tête des messages
    const systemPrompt = SYSTEM_PROMPTS.chat(candidateContext, jobContext)
    const fullMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role !== 'system'),
    ]

    // Streamer la réponse
    const stream = await streamText(fullMessages, { maxTokens: 1024, temperature: 0.7 })

    return new Response(stream, {
      headers: {
        'Content-Type':  'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-AI-Provider': process.env.AI_PROVIDER ?? 'groq',
      },
    })

  } catch (err) {
    console.error('[KazaIA chat]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
