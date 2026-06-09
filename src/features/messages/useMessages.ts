'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Conversation, Message } from '@/lib/types'

const POLL_MS = 5000

export function useConversations(userId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let active = true

    const load = async () => {
      try {
        const res = await fetch('/api/conversations')
        if (res.ok && active) setConversations((await res.json()) as Conversation[])
      } catch { /* garde l'état */ }
      if (active) setLoading(false)
    }

    load()
    const timer = setInterval(load, POLL_MS) // polling (remplace le realtime)
    return () => { active = false; clearInterval(timer) }
  }, [userId])

  return { conversations, loading }
}

export function useMessages(conversationId?: string, currentUserId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const countRef = useRef(0)

  useEffect(() => {
    if (!conversationId) return
    let active = true
    countRef.current = 0

    const load = async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`)
        if (res.ok && active) {
          const data = (await res.json()) as Message[]
          setMessages(data)
          if (data.length !== countRef.current) {
            countRef.current = data.length
            requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }))
          }
        }
      } catch { /* garde l'état */ }
      if (active) setLoading(false)
    }

    load()
    const timer = setInterval(load, POLL_MS) // polling (remplace le realtime)
    return () => { active = false; clearInterval(timer) }
  }, [conversationId, currentUserId])

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !currentUserId || !content.trim()) return

    await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    // Rafraîchit immédiatement
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`)
      if (res.ok) {
        setMessages((await res.json()) as Message[])
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }))
      }
    } catch { /* le polling rattrapera */ }

    // Email notification au destinataire (fire & forget)
    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'new_message', conversationId, senderId: currentUserId }),
    }).catch(() => {})
  }, [conversationId, currentUserId])

  return { messages, loading, sendMessage, bottomRef }
}

export function useStartConversation() {
  return useCallback(async (candidateId: string, recruiterId: string, jobId?: string) => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId, recruiterId, jobId }),
    })
    if (!res.ok) return undefined
    const { id } = await res.json()
    return id as string | undefined
  }, [])
}
