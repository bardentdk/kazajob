import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { profiles, applications, favorites, companies } from '@/lib/db/schema'

// GET /api/account — export RGPD des données de l'utilisateur (téléchargement JSON)
export async function GET() {
  const session = await auth()
  const id = session?.user?.id
  if (!id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1)
  if (!profile) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const { passwordHash: _ph, ...safe } = profile
  const [apps, favs, comps] = await Promise.all([
    db.select().from(applications).where(eq(applications.candidateId, id)),
    db.select().from(favorites).where(eq(favorites.candidateId, id)),
    db.select().from(companies).where(eq(companies.ownerId, id)),
  ])

  const payload = { exportedAt: new Date().toISOString(), profile: safe, applications: apps, favorites: favs, companies: comps }
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="kazajob-mes-donnees.json"',
    },
  })
}

// DELETE /api/account — droit à l'effacement (suppression définitive du compte + cascades)
export async function DELETE() {
  const session = await auth()
  const id = session?.user?.id
  if (!id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  await db.delete(profiles).where(eq(profiles.id, id))
  return NextResponse.json({ ok: true })
}
