'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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

const POLL_MS = 10000

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const activeRef = useRef(true)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/notifications')
      if (res.ok && activeRef.current) setNotifications((await res.json()) as Notification[])
    } catch { /* garde l'état */ }
    if (activeRef.current) setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    activeRef.current = true
    fetchNotifications()
    const timer = setInterval(fetchNotifications, POLL_MS) // polling (remplace le realtime)
    return () => { activeRef.current = false; clearInterval(timer) }
  }, [userId, fetchNotifications])

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' }).catch(() => {})
  }, [])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await fetch('/api/notifications/all', { method: 'PATCH' }).catch(() => {})
  }, [userId])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, loading, unreadCount, markRead, markAllRead }
}
