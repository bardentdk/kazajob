/**
 * KAZAJOB — Profil de l'utilisateur connecté (consommé par useAuth côté client).
 */
import { NextResponse } from 'next/server'
import type { Profile } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { serialize } from '@/lib/queries/_serialize'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json(null, { status: 401 })

  // Retirer le hash ; isoler les blobs jsonb (clés internes camelCase à NE PAS convertir).
  const { passwordHash: _ph, cvData, avatarConfig, ...rest } = user
  const profile = serialize<Profile>(rest)
  // Réattacher les jsonb verbatim sous leur clé snake_case attendue.
  profile.cv_data = (cvData ?? null) as Profile['cv_data']
  profile.avatar_config = (avatarConfig ?? null) as Profile['avatar_config']
  return NextResponse.json(profile)
}
