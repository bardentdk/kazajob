/**
 * KAZAJOB — Couche d'abstraction IA
 * ─────────────────────────────────────────────────────────────
 * Provider actuel : Groq (llama-3.3-70b, gratuit)
 * Pour passer à Claude : AI_PROVIDER=anthropic + ANTHROPIC_API_KEY
 *
 * Interface unique → aucun changement côté application
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIStreamChunk {
  text: string
  done: boolean
}

// ── Config providers ──────────────────────────────────────────

const GROQ_CONFIG = {
  baseUrl: 'https://api.groq.com/openai/v1',
  model:   'llama-3.3-70b-versatile',      // Meilleur modèle Groq gratuit
  // Alternatives Groq :
  //   'mixtral-8x7b-32768'   → contexte 32k, bon pour longs CV
  //   'llama3-8b-8192'       → ultra rapide, qualité légèrement inférieure
  //   'gemma2-9b-it'         → compact, bon rapport qualité/vitesse
}

const ANTHROPIC_CONFIG = {
  // Quand tu passes à Claude, change juste AI_PROVIDER=anthropic
  // La lib @anthropic-ai/sdk sera utilisée automatiquement
  model: 'claude-opus-4-5',    // Meilleur pour la rédaction (ou sonnet pour moins cher)
}

// ── Helpers ───────────────────────────────────────────────────

function getProvider(): 'groq' | 'anthropic' {
  return (process.env.AI_PROVIDER ?? 'groq') as 'groq' | 'anthropic'
}

// ── Génération complète (non-streaming) ───────────────────────

export async function generateText(
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const provider = getProvider()

  if (provider === 'groq') {
    return generateWithGroq(messages, options)
  }

  if (provider === 'anthropic') {
    return generateWithAnthropic(messages, options)
  }

  throw new Error(`Provider inconnu : ${provider}`)
}

// ── Stream (Server-Sent Events) ───────────────────────────────

export async function streamText(
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<ReadableStream<Uint8Array>> {
  const provider = getProvider()

  if (provider === 'groq') {
    return streamWithGroq(messages, options)
  }

  if (provider === 'anthropic') {
    return streamWithAnthropic(messages, options)
  }

  throw new Error(`Provider inconnu : ${provider}`)
}

// ── Implémentation Groq (OpenAI-compatible) ───────────────────

async function generateWithGroq(
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY manquant dans .env.local')

  const res = await fetch(`${GROQ_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:       GROQ_CONFIG.model,
      messages,
      max_tokens:  options?.maxTokens  ?? 2048,
      temperature: options?.temperature ?? 0.7,
      stream:      false,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error ${res.status}: ${err}`)
  }

  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

async function streamWithGroq(
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY manquant dans .env.local')

  const res = await fetch(`${GROQ_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:       GROQ_CONFIG.model,
      messages,
      max_tokens:  options?.maxTokens  ?? 2048,
      temperature: options?.temperature ?? 0.7,
      stream:      true,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API stream error ${res.status}: ${err}`)
  }

  // Transformer le SSE Groq en stream de texte brut
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  return new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter(l => l.trim())

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') { controller.close(); return }

            try {
              const json = JSON.parse(data)
              const text = json.choices?.[0]?.delta?.content ?? ''
              if (text) controller.enqueue(encoder.encode(text))
            } catch {
              // Ignorer les lignes mal formées
            }
          }
        }
      } finally {
        reader.releaseLock()
        controller.close()
      }
    },
  })
}

// ── Implémentation Anthropic (Claude) — prêt pour le futur ────

async function generateWithAnthropic(
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  // Décommenter quand AI_PROVIDER=anthropic et npm install @anthropic-ai/sdk
  //
  // const Anthropic = (await import('@anthropic-ai/sdk')).default
  // const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  //
  // const systemMsg = messages.find(m => m.role === 'system')?.content ?? ''
  // const userMessages = messages.filter(m => m.role !== 'system')
  //
  // const res = await client.messages.create({
  //   model:      ANTHROPIC_CONFIG.model,
  //   max_tokens: options?.maxTokens ?? 2048,
  //   system:     systemMsg,
  //   messages:   userMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  // })
  //
  // return res.content[0].type === 'text' ? res.content[0].text : ''

  throw new Error('Anthropic non configuré — installe @anthropic-ai/sdk et décommente le code dans provider.ts')
}

async function streamWithAnthropic(
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<ReadableStream<Uint8Array>> {
  // Décommenter quand AI_PROVIDER=anthropic
  //
  // const Anthropic = (await import('@anthropic-ai/sdk')).default
  // const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  // const systemMsg = messages.find(m => m.role === 'system')?.content ?? ''
  // const userMessages = messages.filter(m => m.role !== 'system')
  //
  // const encoder = new TextEncoder()
  // const stream = client.messages.stream({
  //   model: ANTHROPIC_CONFIG.model,
  //   max_tokens: options?.maxTokens ?? 2048,
  //   system: systemMsg,
  //   messages: userMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  // })
  //
  // return new ReadableStream({
  //   async start(controller) {
  //     for await (const event of stream) {
  //       if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
  //         controller.enqueue(encoder.encode(event.delta.text))
  //       }
  //     }
  //     controller.close()
  //   },
  // })

  throw new Error('Anthropic streaming non configuré')
}
