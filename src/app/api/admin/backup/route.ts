import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { exportSupabaseData, formatBytes } from '@/lib/backup/supabase-export'
import { uploadToDrive, listBackups } from '@/lib/backup/google-drive'

// ── Vérification admin (ou cron secret) ───────────────────────────
// NB : `exportSupabaseData` exporte toujours depuis Supabase (legacy/rollback).
async function isAuthorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  return !!(await requireAdmin())
}

// ── POST — déclencher un backup ───────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAuthorized(req)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    console.log('[Backup] Démarrage export Supabase...')
    const data = await exportSupabaseData()

    const json     = JSON.stringify(data, null, 2)
    const size     = Buffer.byteLength(json, 'utf8')
    const dateStr  = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')
    const fileName = `kazajob-backup-${dateStr}.json`

    console.log(`[Backup] Export terminé (${formatBytes(size)}) — upload Drive...`)
    const result = await uploadToDrive(json, fileName)

    console.log(`[Backup] Succès — ${result.fileId}`)

    // Résumé des tables
    const summary = Object.entries(data.tableCounts)
      .map(([table, count]) => `${table}: ${count}`)
      .join(', ')

    return NextResponse.json({
      ok:          true,
      fileId:      result.fileId,
      fileName:    result.fileName,
      webViewLink: result.webViewLink,
      sizeBytes:   result.size,
      sizeHuman:   formatBytes(result.size),
      exportedAt:  data.exportedAt,
      summary,
    })

  } catch (err) {
    console.error('[Backup] Erreur :', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Erreur serveur',
    }, { status: 500 })
  }
}

// ── GET — lister les backups existants ────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const isAdmin = await isAuthorized(req)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const backups = await listBackups()
    return NextResponse.json({ backups })

  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Erreur serveur',
    }, { status: 500 })
  }
}
