import { NextRequest, NextResponse } from 'next/server'
import { count, desc, gte, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pageViews } from '@/lib/db/schema'

// GET /api/admin/traffic?days=30 — stats de trafic (admin uniquement)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get('days')) || 30))
  const since = new Date(Date.now() - days * 86_400_000)
  const dayExpr = sql<string>`to_char(${pageViews.createdAt}, 'YYYY-MM-DD')`

  const [top, daily, totalRow] = await Promise.all([
    db.select({ path: pageViews.path, views: count() }).from(pageViews)
      .where(gte(pageViews.createdAt, since)).groupBy(pageViews.path).orderBy(desc(count())).limit(20),
    db.select({ day: dayExpr, views: count() }).from(pageViews)
      .where(gte(pageViews.createdAt, since)).groupBy(dayExpr).orderBy(dayExpr),
    db.select({ n: count() }).from(pageViews).where(gte(pageViews.createdAt, since)),
  ])

  return NextResponse.json({ days, total: totalRow[0]?.n ?? 0, top, daily })
}
