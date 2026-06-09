import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { broadcastNotification } from '@/lib/queries/admin'

// POST /api/admin/notifications  { title, message, link?, target } → { recipients }
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { title, message, link, target } = await req.json().catch(() => ({}))
  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'title et message requis' }, { status: 400 })
  }
  const t = target === 'candidate' || target === 'recruiter' ? target : 'all'
  const recipients = await broadcastNotification(title.trim(), message.trim(), link?.trim() || null, t)
  return NextResponse.json({ recipients })
}
