import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bugReports } from '@/lib/db/schema'

// GET /api/admin/bug-reports → liste des signalements (admin)
export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const rows = await db.select().from(bugReports).orderBy(desc(bugReports.createdAt)).limit(300)
  return NextResponse.json(rows)
}
