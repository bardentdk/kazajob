import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deleteTraining, getRecruiterTraining, updateTraining } from '@/lib/queries/trainings'

async function requireUser() {
  const session = await auth()
  return session?.user?.id ?? null
}
const statusFor = (e: string) => (e === 'Non autorisé' ? 403 : 404)

// GET /api/recruiter/trainings/[id] — formation brute (édition)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  const offer = await getRecruiterTraining(userId, id)
  if (!offer) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json(offer)
}

// PATCH /api/recruiter/trainings/[id]  { ...champs } (maj ou toggle is_active)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const result = await updateTraining(userId, id, body)
  if (result.error) return NextResponse.json({ error: result.error }, { status: statusFor(result.error) })
  return NextResponse.json({ ok: true })
}

// DELETE /api/recruiter/trainings/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  const result = await deleteTraining(userId, id)
  if (result.error) return NextResponse.json({ error: result.error }, { status: statusFor(result.error) })
  return NextResponse.json({ ok: true })
}
