import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamText } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts'
import type { AIMessage } from '@/lib/ai/provider'

export async function POST(req: NextRequest) {
  try {
    const { messages, jobContext } = await req.json() as {
      messages: AIMessage[]
      jobContext?: { title?: string; company?: string }
    }

    const supabase = await createClient()

    // Auth (optionnelle pour le chat — enrichit le contexte si connecté)
    const { data: { user } } = await supabase.auth.getUser()

    let candidateContext: { name?: string; skills?: string[]; location?: string | null } = {}

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, location')
        .eq('id', user.id)
        .single()

      const { data: skillRows } = await supabase
        .from('candidate_skills')
        .select('skill:skills(name)')
        .eq('candidate_id', user.id)

      const skills = (skillRows ?? []).map((s: Record<string, unknown>) => {
        const skill = s.skill as { name?: string } | null
        return skill?.name
      }).filter(Boolean) as string[]

      candidateContext = {
        name:     profile?.full_name,
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
