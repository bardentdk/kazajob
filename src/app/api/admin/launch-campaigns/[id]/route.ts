import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateCampaignConfig, transitionCampaignState, type CampaignConfigPatch } from '@/lib/queries/launch-admin'
import { getLaunchUsage } from '@/lib/queries/launch'
import type { CampaignState } from '@/lib/launch'

// GET /api/admin/launch-campaigns/[id] → aperçu d'impact (entreprises/offres/formations concernées),
// à consulter avant toute action destructive (pause, arrêt, annulation).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const { id } = await params
  const usage = await getLaunchUsage(id)
  return NextResponse.json({ usage })
}

// PATCH /api/admin/launch-campaigns/[id]  { patch?, transitionTo?, version } → config et/ou transition d'état (audité)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const { id } = await params

  const body = (await req.json().catch(() => ({}))) as { patch?: CampaignConfigPatch; transitionTo?: CampaignState; version?: number }
  if (typeof body.version !== 'number') return NextResponse.json({ error: 'version requise' }, { status: 400 })

  if (body.transitionTo) {
    const { error } = await transitionCampaignState(session.user.id, session.user.email ?? null, id, body.transitionTo, body.version)
    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json({ ok: true })
  }
  if (body.patch) {
    const { error } = await updateCampaignConfig(session.user.id, session.user.email ?? null, id, body.patch, body.version)
    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'patch ou transitionTo requis' }, { status: 400 })
}
