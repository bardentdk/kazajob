import { NextResponse } from 'next/server'
import { listAvailableSlots } from '@/lib/queries/demo'

// GET /api/demo/slots → créneaux disponibles (public)
export async function GET() {
  return NextResponse.json(await listAvailableSlots())
}
