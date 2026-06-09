import { NextResponse } from 'next/server'
import { listSkills } from '@/lib/queries/profiles'

// GET /api/skills — référentiel des compétences
export async function GET() {
  return NextResponse.json(await listSkills())
}
