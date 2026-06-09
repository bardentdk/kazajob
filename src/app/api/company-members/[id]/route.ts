import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { changeMemberRole, removeMember } from '@/lib/queries/companies'

async function requireUser() {
  const session = await auth()
  return session?.user?.id ?? null
}

function statusFor(error: string) {
  return error === 'Non autorisé' ? 403 : 404
}

// PATCH /api/company-members/[id]  { role: 'admin' | 'member' }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const { role } = await req.json().catch(() => ({}))
  if (role !== 'admin' && role !== 'member') {
    return NextResponse.json({ error: 'role invalide' }, { status: 400 })
  }
  const result = await changeMemberRole(userId, id, role)
  if (result.error) return NextResponse.json({ error: result.error }, { status: statusFor(result.error) })
  return NextResponse.json({ ok: true })
}

// DELETE /api/company-members/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const result = await removeMember(userId, id)
  if (result.error) return NextResponse.json({ error: result.error }, { status: statusFor(result.error) })
  return NextResponse.json({ ok: true })
}
