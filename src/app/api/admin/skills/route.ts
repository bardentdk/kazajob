import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createSkill, getSkillsWithUsage } from '@/lib/queries/admin'

// GET /api/admin/skills — référentiel + nb d'utilisations
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  return NextResponse.json(await getSkillsWithUsage())
}

// POST /api/admin/skills  { name, category? }
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { name, category } = await req.json().catch(() => ({}))
  if (!name?.trim()) return NextResponse.json({ error: 'name requis' }, { status: 400 })
  await createSkill(name.trim(), category?.trim() || null)
  return NextResponse.json({ ok: true })
}
