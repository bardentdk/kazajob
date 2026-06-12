import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pageViews } from '@/lib/db/schema'

const UUID = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

// POST /api/track  { path } — enregistre une vue de page (anonyme)
export async function POST(req: NextRequest) {
  const { path } = await req.json().catch(() => ({}))
  if (typeof path !== 'string' || !path.startsWith('/') || path.length > 200) {
    return NextResponse.json({ ok: false })
  }
  // Normalise les identifiants dynamiques pour regrouper par type de page.
  const norm = path.split('?')[0].replace(UUID, '/[id]')
  try { await db.insert(pageViews).values({ path: norm }) } catch { /* best-effort */ }
  return NextResponse.json({ ok: true })
}
