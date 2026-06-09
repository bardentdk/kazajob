/**
 * KAZAJOB — Requêtes Drizzle pour les notifications.
 * Couche serveur. Le front consomme `read` (la colonne DB est `is_read`).
 */
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'

export interface NotificationDTO {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown> | null
  read: boolean
  created_at: string
}

function toDTO(n: typeof notifications.$inferSelect): NotificationDTO {
  return {
    id: n.id,
    user_id: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    data: n.data as Record<string, unknown> | null,
    read: n.isRead,
    created_at: n.createdAt.toISOString(),
  }
}

/** 30 dernières notifications d'un utilisateur. */
export async function listNotifications(userId: string): Promise<NotificationDTO[]> {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(30)
  return rows.map(toDTO)
}

/** Marque une notification comme lue (réservé à son propriétaire). */
export async function markNotificationRead(userId: string, id: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
}

/** Marque toutes les notifications de l'utilisateur comme lues. */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
}
