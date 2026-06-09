import { NextResponse } from 'next/server'
import { listPublishedTrainings } from '@/lib/queries/trainings'

// GET /api/trainings — catalogue des formations actives (public)
export async function GET() {
  return NextResponse.json(await listPublishedTrainings())
}
