/**
 * KAZAJOB — Sauvegarde logique (export JSON de toutes les tables).
 *
 * Indépendant de pg_dump (fonctionne sur Windows). Produit un fichier horodaté
 * hors Git, vérifie qu'il est non vide et renvoie le décompte par table.
 * À utiliser AVANT toute purge.
 */
import { mkdirSync, writeFileSync, statSync } from 'fs'
import { join } from 'path'
import { db } from './index'
import * as schema from './schema'
import { getTableName } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'

const BACKUP_DIR = join(process.cwd(), 'backups')

/** Toutes les tables pgTable exportées par le schéma. */
function allTables(): { name: string; table: PgTable }[] {
  const out: { name: string; table: PgTable }[] = []
  for (const value of Object.values(schema)) {
    // Heuristique : un pgTable possède le symbole interne de nom de table.
    try {
      const name = getTableName(value as PgTable)
      if (name) out.push({ name, table: value as PgTable })
    } catch { /* relations / non-table → ignorées */ }
  }
  return out
}

export interface BackupResult {
  file:   string
  counts: Record<string, number>
  total:  number
  bytes:  number
}

function stamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

/** Exporte toutes les tables en JSON. Lève si la sauvegarde semble vide/invalide. */
export async function exportBackup(label = 'kazajob-backup-before-launch-reset'): Promise<BackupResult> {
  mkdirSync(BACKUP_DIR, { recursive: true })
  const tables = allTables()
  const data: Record<string, unknown[]> = {}
  const counts: Record<string, number> = {}
  let total = 0

  for (const { name, table } of tables) {
    const rows = await db.select().from(table)
    data[name] = rows
    counts[name] = rows.length
    total += rows.length
  }

  const file = join(BACKUP_DIR, `${label}-${stamp()}.json`)
  const payload = { createdAt: new Date().toISOString(), counts, total, data }
  writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8')

  const bytes = statSync(file).size
  if (bytes < 2) throw new Error('Sauvegarde invalide (fichier vide).')

  return { file, counts, total, bytes }
}

/** Décompte de lignes par table sensible (sans tout exporter). */
export async function countRows(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const { name, table } of allTables()) {
    const rows = await db.select().from(table)
    counts[name] = rows.length
  }
  return counts
}
