/**
 * KAZAJOB — Requêtes Drizzle pour la messagerie.
 * Couche serveur. Renvoie des objets conformes à `Conversation` / `Message`.
 */
import { and, eq, isNull, ne, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { conversations, messages } from '@/lib/db/schema'
import type { Conversation, Message } from '@/lib/types'
import { serialize } from './_serialize'

/** Vérifie que l'utilisateur est partie prenante de la conversation. */
export async function isParticipant(conversationId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ candidateId: conversations.candidateId, recruiterId: conversations.recruiterId })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1)
  return !!row && (row.candidateId === userId || row.recruiterId === userId)
}

/** Conversations d'un utilisateur (candidat ou recruteur). */
export async function listConversations(userId: string): Promise<Conversation[]> {
  const rows = await db.query.conversations.findMany({
    where: or(eq(conversations.candidateId, userId), eq(conversations.recruiterId, userId)),
    with: {
      candidate: true,
      recruiter: true,
      job: { columns: { title: true }, with: { company: { columns: { name: true } } } },
    },
    orderBy: (c, { desc }) => [desc(c.lastMessageAt)],
  })
  return serialize<Conversation[]>(rows)
}

/** Messages d'une conversation (avec expéditeur), ordre chronologique. */
export async function listMessages(conversationId: string): Promise<Message[]> {
  const rows = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    with: { sender: true },
    orderBy: (m, { asc }) => [asc(m.createdAt)],
  })
  return serialize<Message[]>(rows)
}

/** Marque comme lus les messages reçus (non envoyés par l'utilisateur). */
export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  await db
    .update(messages)
    .set({ isRead: true })
    .where(and(eq(messages.conversationId, conversationId), ne(messages.senderId, userId)))
}

/** Envoie un message et met à jour `last_message_at`. */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
): Promise<void> {
  await db.insert(messages).values({ conversationId, senderId, content: content.trim() })
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId))
}

/** Récupère (ou crée) une conversation entre un candidat et un recruteur. */
export async function startConversation(
  candidateId: string,
  recruiterId: string,
  jobId?: string,
): Promise<string | undefined> {
  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(
      eq(conversations.candidateId, candidateId),
      eq(conversations.recruiterId, recruiterId),
      jobId ? eq(conversations.jobId, jobId) : isNull(conversations.jobId),
    ))
    .limit(1)

  if (existing) return existing.id

  const [created] = await db
    .insert(conversations)
    .values({ candidateId, recruiterId, jobId: jobId ?? null })
    .returning({ id: conversations.id })

  return created?.id
}
