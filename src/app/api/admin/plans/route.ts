import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listPlansAdmin, updatePlanSettings, type PlanSettingsPatch } from '@/lib/queries/plans-admin'

// GET /api/admin/plans → { plans, launchUsage } (admin uniquement)
export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  return NextResponse.json(await listPlansAdmin())
}

// PATCH /api/admin/plans  { planId, patch } → met à jour la disponibilité (audité)
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const planId = String(body.planId ?? '')
  if (!planId) return NextResponse.json({ error: 'planId requis' }, { status: 400 })
  const patch = (body.patch ?? {}) as PlanSettingsPatch

  const { error } = await updatePlanSettings(session.user.id, session.user.email ?? null, planId, patch)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
