import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bugReports } from '@/lib/db/schema'

const STATUSES = ['open', 'in_progress', 'resolved']

// PATCH /api/admin/bug-reports/[id]  { status } — met à jour le statut (admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const { id } = await params
  const { status } = await req.json().catch(() => ({}))
  if (!STATUSES.includes(status)) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })

  await db.update(bugReports).set({ status }).where(eq(bugReports.id, id))
  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/bug-reports/[id] — supprime un signalement (admin)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const { id } = await params
  await db.delete(bugReports).where(eq(bugReports.id, id))
  return NextResponse.json({ ok: true })
}
