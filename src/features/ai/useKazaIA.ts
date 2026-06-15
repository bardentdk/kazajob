'use client'

import { useState, useCallback, useRef } from 'react'
import type { AIMessage } from '@/lib/ai/provider'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

// ── Hook chat avec streaming ───────────────────────────────────

export function useKazaChat(jobContext?: { title?: string; company?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (streaming || !content.trim()) return

    // Ajouter le message utilisateur
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content }
    const assistantMsgId = crypto.randomUUID()
    const assistantMsg: ChatMessage = { id: assistantMsgId, role: 'assistant', content: '', loading: true }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    // Construire l'historique pour l'API
    const history: AIMessage[] = messages
      .filter(m => !m.loading)
      .map(m => ({ role: m.role, content: m.content }))
    history.push({ role: 'user', content })

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/kaza-ia/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history, jobContext }),
        signal:  abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erreur API')
      }

      // Lire le stream chunk par chunk
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        accumulated += decoder.decode(value, { stream: true })

        // Mettre à jour le message en temps réel
        setMessages(prev =>
          prev.map(m => m.id === assistantMsgId
            ? { ...m, content: accumulated, loading: false }
            : m
          )
        )
      }

      setMessages(prev =>
        prev.map(m => m.id === assistantMsgId
          ? { ...m, content: accumulated || 'Désolé, aucune réponse reçue.', loading: false }
          : m
        )
      )

    } catch (err) {
      if ((err as Error).name === 'AbortError') return

      const errorText = err instanceof Error ? err.message : 'Erreur inconnue'
      setMessages(prev =>
        prev.map(m => m.id === assistantMsgId
          ? { ...m, content: `Erreur : ${errorText}`, loading: false }
          : m
        )
      )
    } finally {
      setStreaming(false)
    }
  }, [messages, streaming, jobContext])

  const stopStream = useCallback(() => {
    abortRef.current?.abort()
    setStreaming(false)
  }, [])

  const clearChat = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setStreaming(false)
  }, [])

  return { messages, streaming, sendMessage, stopStream, clearChat }
}

// ── Hook génération lettre de motivation ──────────────────────

export function useCoverLetterAI() {
  const [generating, setGenerating] = useState(false)
  const [letter, setLetter] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (
    jobId: string,
    tone: 'professional' | 'creative' | 'concise' = 'professional'
  ) => {
    setGenerating(true)
    setError(null)
    setLetter(null)

    try {
      const res = await fetch('/api/kaza-ia/cover-letter', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jobId, tone }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur API')
      setLetter(data.letter)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setGenerating(false)
    }
  }, [])

  const reset = useCallback(() => { setLetter(null); setError(null) }, [])

  return { generating, letter, error, generate, reset }
}

// ── Hook explication / simplification d'une offre ──────────────

export interface JobExplain {
  synthese: string
  missions: string[]
  reformulation: string
  salaire: string
  competences: string[]
}

export function useExplainJobAI() {
  const [generating, setGenerating] = useState(false)
  const [explain, setExplain] = useState<JobExplain | null>(null)
  const [raw, setRaw] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (jobId: string) => {
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/kaza-ia/explain-job', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jobId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur API')
      setExplain(data.explain ?? null)
      setRaw(data.raw ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setGenerating(false)
    }
  }, [])

  return { generating, explain, raw, error, generate }
}

// ── Hook synthèse de candidature (recruteur, plans 3 & 4) ──────

export interface ApplicationSummary {
  resume: string
  adequation: number
  competences_match: string[]
  points_forts: string[]
  points_vigilance: string[]
  experiences: string[]
  decision: string
}

export function useApplicationSummaryAI() {
  const [generating, setGenerating] = useState(false)
  const [summary, setSummary] = useState<ApplicationSummary | null>(null)
  const [raw, setRaw] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState<string | null>(null)

  const generate = useCallback(async (applicationId: string) => {
    setGenerating(true)
    setError(null)
    setLocked(null)

    try {
      const res = await fetch('/api/kaza-ia/application-summary', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ applicationId }),
      })

      const data = await res.json()
      if (res.status === 402) { setLocked(data.message ?? 'Fonctionnalité réservée aux plans supérieurs.'); return }
      if (!res.ok) throw new Error(data.error ?? 'Erreur API')
      setSummary(data.summary ?? null)
      setRaw(data.raw ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setGenerating(false)
    }
  }, [])

  const reset = useCallback(() => { setSummary(null); setRaw(null); setError(null); setLocked(null) }, [])

  return { generating, summary, raw, error, locked, generate, reset }
}

// ── Hook KazaCoach (assistant candidat) ────────────────────────

export interface KazaCoachResult {
  compatibilite: number
  competences_manquantes: string[]
  experience_recommandee: string
  conseils: string[]
  ameliorations: string[]
}

export function useKazaCoach() {
  const [generating, setGenerating] = useState(false)
  const [coach, setCoach] = useState<KazaCoachResult | null>(null)
  const [raw, setRaw] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (targetRole?: string) => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/kaza-ia/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur API')
      setCoach(data.coach ?? null)
      setRaw(data.raw ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setGenerating(false)
    }
  }, [])

  return { generating, coach, raw, error, generate }
}

// ── Hook préparation entretien ─────────────────────────────────

export function useInterviewPrepAI() {
  const [generating, setGenerating] = useState(false)
  const [questions, setQuestions] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (jobId: string) => {
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/kaza-ia/interview-prep', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jobId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur API')
      setQuestions(data.questions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setGenerating(false)
    }
  }, [])

  return { generating, questions, error, generate }
}
