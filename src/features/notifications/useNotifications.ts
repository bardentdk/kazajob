'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  user_id: string
  type: 'application_status' | 'new_job_match' | 'interview_scheduled' | 'application_withdrawn' | string
  title: string
  message: string
  data: Record<string, unknown> | null
  read: boolean
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  application_status:     '📋',
  new_job_match:          '✨',
  interview_scheduled:    '📅',
  application_withdrawn:  '↩️',
}

export function getNotifIcon(type: string): string {
  return TYPE_ICON[type] ?? '🔔'
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setNotifications(data as Notification[])
    setLoading(false)
  }, [userId, supabase])

  useEffect(() => {
    fetchNotifications()

    if (!userId) return

    // ── Realtime subscription ──────────────────────────────────
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchNotifications, supabase])

  const markRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [supabase])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [userId, supabase])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, loading, unreadCount, markRead, markAllRead }
}
