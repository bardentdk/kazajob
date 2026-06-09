import { NextRequest } from 'next/server'
import { auth, getCurrentUser } from '@/lib/auth'
import { getCandidateSkills } from '@/lib/queries/profiles'
import { streamText } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts'
import type { AIMessage } from '@/lib/ai/provider'

export async function POST(req: NextRequest) {
  try {
    const { messages, jobContext } = await req.json() as {
      messages: AIMessage[]
      jobContext?: { title?: string; company?: string }
    }

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
