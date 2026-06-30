import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listCampaignsAdmin, createCampaign, type CampaignCreateInput } from '@/lib/queries/launch-admin'
import { getLaunchUsage } from '@/lib/queries/launch'

// GET /api/admin/launch-campaigns → { campaigns, usage } (admin uniquement)
export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const [campaigns, usage] = await Promise.all([listCampaignsAdmin(), getLaunchUsage()])
  return NextResponse.json({ campaigns, usage })
}

// POST /api/admin/launch-campaigns  { name, slug, ... } → crée une campagne à l'état DRAFT (auditée)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = (await req.json().catch(() => ({}))) as Partial<CampaignCreateInput>
  if (!body.name || !body.slug) return NextResponse.json({ error: 'Nom et identifiant requis.' }, { status: 400 })

  const result = await createCampaign(session.user.id, session.user.email ?? null, body as CampaignCreateInput)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json(result, { status: 201 })
}
