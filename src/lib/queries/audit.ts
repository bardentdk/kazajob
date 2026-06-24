/**
 * KAZAJOB — Journal d'audit (actions sensibles : monétisation, reset, admin).
 * Ne journalise JAMAIS de secret (mot de passe, clé). Best-effort : un échec
 * d'écriture d'audit ne doit pas faire échouer l'opération métier.
 */
import { randomUUID } from 'crypto'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'
import { serialize } from './_serialize'

export interface AuditEntry {
  actorId?:       string | null
  actorEmail?:    string | null
  action:         string
  targetType?:    string | null
  targetId?:      string | null
  oldValues?:     unknown
  newValues?:     unknown
  correlationId?: string | null
  context?:       unknown
}

export async function writeAudit(e: AuditEntry): Promise<string | null> {
  const correlationId = e.correlationId ?? randomUUID()
  try {
    await db.insert(auditLogs).values({
      actorId:       e.actorId ?? null,
      actorEmail:    e.actorEmail ?? null,
      action:        e.action,
      targetType:    e.targetType ?? null,
      targetId:      e.targetId ?? null,
      oldValues:     (e.oldValues ?? null) as object | null,
      newValues:     (e.newValues ?? null) as object | null,
      correlationId,
      context:       (e.context ?? null) as object | null,
    })
    return correlationId
  } catch (err) {
    console.error('[audit] échec écriture', String(err).slice(0, 200))
    return null
  }
}

/** Derniers événements d'audit (admin). */
export async function listAudit(limit = 50) {
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit)
  return serialize(rows)
}
