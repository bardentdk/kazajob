'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message } from '@/lib/types'

export function useConversations(userId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return
    const fetch = async () => {
      const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          candidate:profiles!candidate_id(*),
          recruiter:profiles!recruiter_id(*),
          job:jobs(title, company:companies(name))
        `)
        .or(`candidate_id.eq.${userId},recruiter_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })

      if (data) setConversations(data as Conversation[])
      setLoading(false)
    }

    fetch()

    const sub = supabase
      .channel('conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetch)
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [userId, supabase])

  return { conversations, loading }
}

export function useMessages(conversationId?: string, currentUserId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!conversationId) return
    const fetch = async () => {
      const { data } = await supabase
        .from('messages')
        .select(`*, sender:profiles(*)`)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data as Message[])
      setLoading(false)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    fetch()

    // Mark messages as read
    if (currentUserId) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .then(() => {})
    }

    const sub = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [conversationId, currentUserId, supabase])

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !currentUserId || !content.trim()) return

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content.trim(),
    })

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)
  }, [conversationId, currentUserId, supabase])

  return { messages, loading, sendMessage, bottomRef }
}

export function useStartConversation() {
  const supabase = createClient()

  return useCallback(async (candidateId: string, recruiterId: string, jobId?: string) => {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('recruiter_id', recruiterId)
      .eq('job_id', jobId ?? null)
      .single()

    if (existing) return existing.id

    const { data } = await supabase
      .from('conversations')
      .insert({ candidate_id: candidateId, recruiter_id: recruiterId, job_id: jobId })
      .select('id')
      .single()

    return data?.id
  }, [supabase])
}
