import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  addCandidateSkill,
  addCandidateSkillsByNames,
  getCandidateSkills,
  removeCandidateSkill,
} from '@/lib/queries/profiles'

async function requireUser() {
  const session = await auth()
  return session?.user?.id ?? null
}

// GET /api/candidate-skills — mes compétences
export async function GET() {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  return NextResponse.json(await getCandidateSkills(userId))
}

// POST /api/candidate-skills  { skillId }  ou  { names: string[] }
export async function POST(req: NextRequest) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (Array.isArray(body.names)) {
    await addCandidateSkillsByNames(userId, body.names)
  } else if (body.skillId) {
    await addCandidateSkill(userId, body.skillId)
  } else {
    return NextResponse.json({ error: 'skillId ou names requis' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}

// DELETE /api/candidate-skills?skillId=...
export async function DELETE(req: NextRequest) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const skillId = req.nextUrl.searchParams.get('skillId')
  if (!skillId) return NextResponse.json({ error: 'skillId requis' }, { status: 400 })

  await removeCandidateSkill(userId, skillId)
  return NextResponse.json({ ok: true })
}
