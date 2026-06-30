import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { launchCampaigns } from '@/lib/db/schema'
import { effectiveCampaignStatus, type CampaignState } from '@/lib/launch'

// GET /api/launch/public → disponibilité publique de la campagne de lancement (sans auth, sans données entreprise).
// Sert au wording dynamique des pages publiques (afficher/masquer l'annonce de campagne).
export async function GET() {
  const rows = await db.select({
    state: launchCampaigns.state, startsAt: launchCampaigns.startsAt, endsAt: launchCampaigns.endsAt,
    freePublishingEnabled: launchCampaigns.freePublishingEnabled, name: launchCampaigns.name,
  }).from(launchCampaigns)

  const active = rows.find((c) => c.freePublishingEnabled && effectiveCampaignStatus(c.state as CampaignState, c.startsAt, c.endsAt) === 'active')
  return NextResponse.json({ available: !!active, campaignName: active?.name ?? null })
}
